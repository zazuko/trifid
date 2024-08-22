// @ts-check

import { Readable } from 'node:stream'
import { performance } from 'node:perf_hooks'
import { Worker } from 'node:worker_threads'
import { sparqlGetRewriteConfiguration } from 'trifid-core'
import replaceStream from 'string-replace-stream'
import rdf from '@zazuko/env-node'

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
  queryLogLevel: 'debug', // Log level for queries
  serviceDescriptionWorkerUrl: new URL('./lib/serviceDescriptionWorker.js', import.meta.url),
  serviceDescriptionTimeout: 5000, // max time to wait for the service description
  serviceDescriptionFormat: undefined, // override the accept header for the service description request. by default, will use content negotiation using formats `@zazuko/env-node` can parse
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
  const { logger, config, trifidEvents } = trifid

  const options = { ...defaultConfiguration, ...config }
  if (!options.endpointUrl) {
    throw Error('Missing endpointUrl parameter')
  }

  let authorizationHeader
  if (options.username && options.password) {
    authorizationHeader = authBasicHeader(options.username, options.password)
  }

  const datasetBaseUrl = options.datasetBaseUrl
  const allowRewriteToggle = options.allowRewriteToggle
  const rewriteConfigValue = options.rewrite
  const rewriteConfig = sparqlGetRewriteConfiguration(rewriteConfigValue, datasetBaseUrl)

  const queryLogLevel = options.queryLogLevel
  if (!logger[queryLogLevel]) {
    throw Error(`Invalid queryLogLevel: ${queryLogLevel}`)
  }
  /**
   * Log a query, depending on the `queryLogLevel`.
   * @param {string} msg Message to log
   * @returns {void}
   */
  const queryLogger = (msg) => logger[queryLogLevel](msg)

  const worker = new Worker(options.serviceDescriptionWorkerUrl)
  worker.postMessage({
    type: 'config',
    data: {
      endpointUrl: options.endpointUrl,
      serviceDescriptionTimeout: options.serviceDescriptionTimeout,
      serviceDescriptionFormat: options.serviceDescriptionFormat,
      authorizationHeader,
    },
  })

  const serviceDescription = new Promise((resolve) => {
    const minimalSD = rdf.clownface().blankNode().addOut(rdf.ns.rdf.type, rdf.ns.sd.Service)

    worker.once('message', async (message) => {
      const { type, data } = message
      switch (type) {
        case 'serviceDescription':
          resolve(await rdf.dataset().import(
            rdf.formats.parsers.import('application/n-triples', Readable.from(data)),
          ))
          break
        case 'serviceDescriptionTimeOut':
          logger.warn('The proxied SPARQL endpoint did not return a Service Description in a timely fashion. Will return a minimal document')
          logger.info('You can increase the timeout using the \'serviceDescriptionTimeout\' configuration')
          resolve(minimalSD.dataset)
          break
        case 'serviceDescriptionError':
          logger.error('Error while fetching the Service Description. Will return a minimal document')
          logger.error(data)
          resolve(minimalSD.dataset)
          break
      }
    })
  })

  trifidEvents.on('close', async () => {
    logger.debug('Got "close" event from Trifid ; closing worker…')
    await worker.terminate().catch(logger.error.bind(logger))
    logger.debug('Worker terminated')
  })

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
          reply.redirect(`${fullUrlPathname.slice(0, -1)}`)
          return reply
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
        const method = request.method
        switch (method) {
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
            reply.code(405).send('Method Not Allowed')
            return reply
        }

        if (!query && method === 'GET') {
          const dataset = await serviceDescription
          rdf.clownface({ dataset })
            .has(rdf.ns.rdf.type, rdf.ns.sd.Service)
            .addOut(rdf.ns.sd.endpoint, rdf.namedNode(fullUrl))

          const accept = request.accepts()
          const negotiatedTypes = accept.type([...rdf.formats.serializers.keys()])
          const negotiatedType = Array.isArray(negotiatedTypes) ? negotiatedTypes[0] : negotiatedTypes
          if (!negotiatedType) {
            reply.code(406).send()
            return reply
          }

          reply
            .header('content-type', negotiatedType)
            .send(await dataset.serialize({ format: negotiatedType }))
          return reply
        }

        if (rewriteResponse && options.rewriteQuery) {
          query = query.replaceAll(rewriteResponse.replacement, rewriteResponse.origin)
        }

        logger.debug('Got a request to the sparql proxy')
        queryLogger(`Received query${rewriteValue ? ' (rewritten)' : ''} via ${method}:\n${query}`)

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

          const start = performance.now()
          const response = await fetch(options.endpointUrl, {
            method: 'POST',
            headers,
            body: new URLSearchParams({ query }),
          })
          const end = performance.now()
          const duration = end - start

          const contentType = response.headers.get('content-type')

          /** @type {any} */
          let responseStream = response.body
          if (rewriteResponse && options.rewriteResults) {
            responseStream = Readable
              .from(responseStream)
              .pipe(replaceStream(
                rewriteResponse.origin,
                rewriteResponse.replacement,
              ))
          }
          responseStream = Readable.fromWeb(responseStream)

          reply
            .status(response.status)
            .header('Server-Timing', `sparql-proxy;dur=${duration};desc="Querying the endpoint"`)
            .header('content-type', contentType)
            .send(responseStream)
          return reply
        } catch (error) {
          logger.error('Error while querying the endpoint')
          logger.error(error)
          reply
            .code(500)
            .send('Error while querying the endpoint')
          return reply
        }
      }
      return handler
    },
  }
}

export default factory
