// @ts-check

import { Readable } from 'node:stream'
import { ReadableStream } from 'node:stream/web'
import { performance } from 'node:perf_hooks'
import { Worker } from 'node:worker_threads'
import { createHash } from 'node:crypto'

import { sparqlGetRewriteConfiguration } from 'trifid-core'
import rdf from '@zazuko/env-node'
import ReplaceStream from './lib/ReplaceStream.js'
import { authBasicHeader, objectLength, isValidUrl } from './lib/utils.js'

// TODO: remove this once QLever supports other formats (experimental flag that would be removed at any time)
const engineMode = process.env.TRIFID_ENGINE_MODE || 'default'

const defaultConfiguration = {
  endpointUrl: '',
  username: '',
  password: '',
  headers: {}, // Additional headers to send to the SPARQL endpoint
  endpoints: {},
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

const oneMonthMilliseconds = 60 * 60 * 24 * 30 * 1000
const DEFAULT_ENDPOINT_NAME = 'default'

/** @type {import('../core/types/index.js').TrifidPlugin} */
const factory = async (trifid) => {
  const { logger, config, trifidEvents } = trifid

  const endpoints = new Map()

  const options = { ...defaultConfiguration, ...config }
  let dynamicEndpoints = false

  if (objectLength(options.endpoints) > 0) {
    // Check if the default endpoint is defined
    if (!Object.hasOwnProperty.call(options.endpoints, DEFAULT_ENDPOINT_NAME)) {
      throw Error('Missing default endpoint in the endpoints configuration')
    }

    // Override default values with the default endpoint values (in case it's a valid URL ; else it might be the default /query)
    if (isValidUrl(options.endpoints.default)) {
      options.endpointUrl = options.endpoints.default.url || ''
      options.username = options.endpoints.default.username || ''
      options.password = options.endpoints.default.password || ''
      options.headers = options.endpoints.default.headers || {}
    }

    // Support for multiple endpoints
    dynamicEndpoints = true
  }

  if (!options.endpointUrl) {
    throw Error(
      dynamicEndpoints
        ? `Missing endpoints.${DEFAULT_ENDPOINT_NAME}.url parameter`
        : 'Missing endpointUrl parameter',
    )
  }

  if (options.username && options.password) {
    options.headers.Authorization = authBasicHeader(options.username, options.password)
  }

  const datasetBaseUrl = options.datasetBaseUrl
  const allowRewriteToggle = options.allowRewriteToggle
  const rewriteConfigValue = options.rewrite
  const rewriteConfig = sparqlGetRewriteConfiguration(rewriteConfigValue, datasetBaseUrl)

  endpoints.set(DEFAULT_ENDPOINT_NAME, {
    endpointUrl: options.endpointUrl,
    username: options.username,
    password: options.password,
    headers: options.headers,
    datasetBaseUrl,
    allowRewriteToggle,
    rewriteConfigValue,
    rewriteConfig,
  })

  if (dynamicEndpoints) {
    for (const [endpointName, endpointConfig] of Object.entries(options.endpoints)) {
      if (endpointName === DEFAULT_ENDPOINT_NAME) {
        continue
      }

      if (!endpointConfig.url) {
        throw Error(`Missing endpoints.${endpointName}.url parameter`)
      }

      const endpointHeaders = endpointConfig.headers || {}
      if (endpointConfig.username && endpointConfig.password) {
        endpointHeaders.Authorization = authBasicHeader(endpointConfig.username, endpointConfig.password)
      }

      const endpointDatasetBaseUrl = endpointConfig.datasetBaseUrl || datasetBaseUrl
      const endpointRewriteConfigValue = endpointConfig.rewrite ?? rewriteConfigValue

      endpoints.set(endpointName, {
        endpointUrl: endpointConfig.url || '',
        username: endpointConfig.username || '',
        password: endpointConfig.password || '',
        headers: endpointHeaders,
        datasetBaseUrl: endpointDatasetBaseUrl,
        allowRewriteToggle: endpointConfig.allowRewriteToggle ?? allowRewriteToggle,
        rewriteConfigValue: endpointRewriteConfigValue,
        rewriteConfig: sparqlGetRewriteConfiguration(endpointRewriteConfigValue, endpointDatasetBaseUrl),
      })
    }
  }

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
      headers: options.headers,
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
       * @property {string} [endpoint] The name of the endpoint to use (default: DEFAULT_ENDPOINT_NAME).
       */

      /**
       * Request body type.
       * @typedef {Object} RequestBody
       * @property {string} [query] The SPARQL query.
       */

      /**
       * Route handler.
       * @param {import('fastify').FastifyRequest<{ Querystring: QueryString, Body: RequestBody | string }> & { cookies: { endpointName?: string }, accepts: () => { type: (types: string[]) => string[] | string | false }} & { opentelemetry: () => import('@fastify/otel/types/types.d.ts').FastifyOtelRequestContext}} request Request.
       * @param {import('fastify').FastifyReply & { setCookie: (name: string, value: string, opts?: any) => {}, clearCookie: (name: string, opts?: any) => {}}} reply Reply.
       */
      const handler = async (request, reply) => {
        const savedEndpointName = request.cookies.endpointName || DEFAULT_ENDPOINT_NAME
        let endpointName = request.query.endpoint || savedEndpointName
        endpointName = endpointName.replace(/[^a-z0-9-]/gi, '')

        // Only set the cookie if the endpoint name has changed and if it's not the default endpoint
        if (request.cookies.endpointName !== endpointName && endpointName !== DEFAULT_ENDPOINT_NAME) {
          reply.setCookie('endpointName', endpointName, { maxAge: oneMonthMilliseconds, path: '/' })
          // Clear the cookie if the endpoint name is the default one
        } else if (endpointName === DEFAULT_ENDPOINT_NAME && request.cookies.endpointName !== undefined) {
          reply.clearCookie('endpointName', { path: '/' })
        }

        const endpoint = endpoints.get(endpointName)
        if (!endpoint) {
          return reply.callNotFound()
        }
        logger.debug(`Using endpoint: ${endpointName}`)

        let requestPort = ''
        if (request.port) {
          requestPort = `:${request.port}`
        }
        const fullUrl = `${request.protocol}://${request.hostname}${requestPort}${request.url}`
        const fullUrlObject = new URL(fullUrl)
        const fullUrlPathname = fullUrlObject.pathname

        // Generate the IRI we expect
        fullUrlObject.search = ''
        fullUrlObject.searchParams.forEach((_value, key) => fullUrlObject.searchParams.delete(key))
        const iriUrlString = fullUrlObject.toString()

        // Handle Service Description request
        if (Object.keys(request.query).length === 0 && request.method === 'GET') {
          const dataset = rdf.dataset(await serviceDescription)
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
            // @ts-ignore (cause: broken type definitions)
            .send(await dataset.serialize({ format: negotiatedType }))
          return reply
        }

        // Enforce non-trailing slash
        if (fullUrlPathname.slice(-1) === '/') {
          reply.redirect(`${fullUrlPathname.slice(0, -1)}`)
          return reply
        }

        let currentRewriteConfig = endpoint.rewriteConfig
        if (endpoint.allowRewriteToggle) {
          let rewriteConfigValueFromQuery = endpoint.rewriteConfigValue
          if (`${request.query.rewrite}` === 'false') {
            rewriteConfigValueFromQuery = false
          } else if (`${request.query.rewrite}` === 'true') {
            rewriteConfigValueFromQuery = true
          }
          currentRewriteConfig = sparqlGetRewriteConfiguration(rewriteConfigValueFromQuery, endpoint.datasetBaseUrl)
        }
        const { rewrite: rewriteValue, iriOrigin } = currentRewriteConfig
        const rewriteResponse = rewriteValue
          ? {
            origin: endpoint.datasetBaseUrl,
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

        if (rewriteResponse && options.rewriteQuery) {
          query = query.replaceAll(rewriteResponse.replacement, rewriteResponse.origin)
        }

        logger.debug('Got a request to the sparql proxy')
        queryLogger(`Received query${rewriteValue ? ' (rewritten)' : ''} via ${method}:\n${query}`)

        if (request.opentelemetry) {
          const { span } = request.opentelemetry()
          span.setAttribute('db.system', 'sparql')
          span.setAttribute('sparql.query.hash', createHash('sha256').update(query).digest('hex'))
          span.addEvent('sparql.query', { statement: query })
        }

        try {
          let acceptHeader = request.headers.accept || 'application/sparql-results+json'
          if (request.query.format) {
            acceptHeader = options.formats[request.query.format] || acceptHeader
          }

          // TODO: remove this tweak once QLever supports other formats
          if (engineMode === 'qlever' && !acceptHeader.startsWith('application/sparql-results+json')) {
            acceptHeader = 'text/turtle'
          }

          const headers = {
            ...endpoint.headers,
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: acceptHeader,
          }

          const start = performance.now()
          let response = await fetch(endpoint.endpointUrl, {
            method: 'POST',
            headers,
            body: new URLSearchParams({ query }),
          })
          const end = performance.now()
          const duration = end - start

          if (!response) {
            logger.warn('No response from the endpoint, make sure that the endpoint is reachable')
            response = new Response(JSON.stringify({
              success: false,
              message: 'No response from the endpoint',
            }), { status: 502, headers: { 'content-type': 'application/json' } })
          }

          const contentType = response.headers.get('content-type')

          /** @type {any} */
          let responseStream = response.body
          if (rewriteResponse && options.rewriteResults) {
            const replaceStream = new ReplaceStream(rewriteResponse.origin, rewriteResponse.replacement)
            responseStream = Readable
              .from(responseStream)
              .pipe(replaceStream)
            responseStream = Readable
              .from(responseStream)
          }
          if (responseStream instanceof ReadableStream) {
            responseStream = Readable.fromWeb(responseStream)
          }

          let proxyReply = reply
            .status(response.status)
            .header('Server-Timing', `sparql-proxy;dur=${duration};desc="Querying the endpoint"`)
          if (contentType) {
            proxyReply = proxyReply.header('content-type', contentType)
          }
          proxyReply.send(responseStream)
          return proxyReply
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
