// @ts-check

import { Readable } from 'node:stream'
import { sparqlGetRewriteConfiguration } from 'trifid-core'
import replaceStream from 'string-replace-stream'

const defaultConfiguration = {
  endpointUrl: '',
  username: '',
  password: '',
  datasetBaseUrl: '',
  allowRewriteToggle: true, // Allow the user to toggle the rewrite configuration using the `rewrite` query parameter.
  rewrite: false, // Rewrite by default
  rewriteQuery: true, // Allow rewriting the query
  rewriteResults: true, // Allow rewriting the results
  formats: {},
}

/**
 * Generate the value for the Authorization header for basic authentication.
 *
 * @param {string} user The username.
 * @param {string} password The password of that user.
 * @returns {string} The value of the Authorization header to use.
 */
const authBasicHeader = (user, password) => {
  const base64String = Buffer.from(`${user}:${password}`).toString('base64')
  return `Basic ${base64String}`
}

/** @type {import('../core/types/index.js').TrifidPlugin} */
const factory = async (trifid) => {
  const { logger, config } = trifid

  const options = { ...defaultConfiguration, ...config }
  if (!options.endpointUrl) {
    throw Error('Missing endpointUrl parameter')
  }

  let authorizationHeader = ''
  if (options.username && options.password) {
    authorizationHeader = authBasicHeader(options.username, options.password)
  }

  const datasetBaseUrl = options.datasetBaseUrl
  const allowRewriteToggle = options.allowRewriteToggle
  const rewriteConfigValue = options.rewrite
  const rewriteConfig = sparqlGetRewriteConfiguration(rewriteConfigValue, datasetBaseUrl)

  return {
    defaultConfiguration: async () => {
      return {
        methods: ['GET', 'POST'],
        paths: [
          '/query',
          '/query/',
        ],
      }
    },
    routeHandler: async () => {
      /**
       * Query string type.
       *
       * @typedef {Object} QueryString
       * @property {string} [query] The SPARQL query.
       * @property {string} [rewrite] Should the query and the results be rewritten?
       * @property {string} [format] The format of the results.
       */

      /**
       * Request body type.
       * @typedef {Object} RequestBody
       * @property {string} [query] The SPARQL query.
       */

      /**
       * Route handler.
       * @param {import('fastify').FastifyRequest<{ Querystring: QueryString, Body: RequestBody | string }>} request Request.
       * @param {import('fastify').FastifyReply} reply Reply.
       */
      const handler = async (request, reply) => {
        const fullUrl = `${request.protocol}://${request.hostname}${request.raw.url}`
        const fullUrlObject = new URL(fullUrl)
        const fullUrlPathname = fullUrlObject.pathname

        // Generate the IRI we expect
        fullUrlObject.search = ''
        fullUrlObject.searchParams.forEach((_value, key) => fullUrlObject.searchParams.delete(key))
        const iriUrlString = fullUrlObject.toString()

        // Enforce non-trailing slash
        if (fullUrlPathname.slice(-1) === '/') {
          return reply.redirect(`${fullUrlPathname.slice(0, -1)}`)
        }

        let currentRewriteConfig = rewriteConfig
        if (allowRewriteToggle) {
          let rewriteConfigValueFromQuery = rewriteConfigValue
          if (`${request.query.rewrite}` === 'false') {
            rewriteConfigValueFromQuery = false
          } else if (`${request.query.rewrite}` === 'true') {
            rewriteConfigValueFromQuery = true
          } else {
            rewriteConfigValueFromQuery = rewriteConfigValue
          }
          currentRewriteConfig = sparqlGetRewriteConfiguration(rewriteConfigValueFromQuery, datasetBaseUrl)
        }
        const { rewrite: rewriteValue, iriOrigin } = currentRewriteConfig
        const rewriteResponse = rewriteValue
          ? {
            origin: datasetBaseUrl,
            replacement: iriOrigin(iriUrlString),
          }
          : false

        let query = ''
        switch (request.method) {
          case 'GET':
            query = request.query.query || ''
            break
          case 'POST':
            if (typeof request.body === 'string') {
              query = request.body
            }

            if (typeof request.body !== 'string' && request.body.query) {
              query = request.body.query
            }

            if (typeof query !== 'string') {
              query = JSON.stringify(query)
            }

            break
          default:
            return reply.code(405).send('Method Not Allowed')
        }

        if (rewriteResponse && options.rewriteQuery) {
          query = query.replaceAll(rewriteResponse.replacement, rewriteResponse.origin)
        }

        logger.debug('Got a request to the sparql proxy')
        logger.debug(`Received query${rewriteValue ? ' (rewritten)' : ''}:\n${query}`)

        try {
          let acceptHeader = request.headers.accept || 'application/sparql-results+json'
          if (request.query.format) {
            acceptHeader = options.formats[request.query.format] || acceptHeader
          }
          const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: acceptHeader,
          }
          if (authorizationHeader) {
            headers.Authorization = authorizationHeader
          }
          const response = await fetch(options.endpointUrl, {
            method: 'POST',
            headers,
            body: new URLSearchParams({ query }),
          })

          const contentType = response.headers.get('content-type')

          let responseStream = response.body
          if (rewriteResponse && options.rewriteResults) {
            responseStream = Readable
              .from(responseStream)
              .pipe(replaceStream(
                rewriteResponse.origin,
                rewriteResponse.replacement,
              ))
          }

          return reply
            .status(response.status)
            .header('content-type', contentType)
            .send(responseStream)
        } catch (error) {
          logger.error('Error while querying the endpoint')
          logger.error(error)
          return reply
            .code(500)
            .send('Error while querying the endpoint')
        }
      }
      return handler
    },
  }
}

export default factory
