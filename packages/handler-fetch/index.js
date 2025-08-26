// @ts-check

import { Worker } from 'node:worker_threads'
import { performance } from 'node:perf_hooks'

import { metrics } from '@opentelemetry/api'
import { v4 as uuidv4 } from 'uuid'

import { waitForVariableToBeTrue } from './lib/utils.js'

const meter = metrics.getMeter('handler-fetch')
const sparqlQueryCounter = meter.createCounter('sparql_queries_total', {
  description: 'Number of SPARQL queries received',
})

/** @type {import('../core/types/index.js').TrifidPlugin} */
export const factory = async (trifid) => {
  const { config, logger, trifidEvents } = trifid
  const { contentType, url, baseIri, graphName, unionDefaultGraph } = config

  const queryLogLevel = config.queryLogLevel || 'debug'
  if (!logger[queryLogLevel]) {
    throw Error(`Invalid queryLogLevel: ${queryLogLevel}`)
  }
  /**
   * Log a query, depending on the `queryLogLevel`.
   * @param {string} msg Message to log
   * @returns {void}
   */
  const queryLogger = (msg) => logger[queryLogLevel](msg)

  const queryTimeout = 30000

  const workerUrl = new URL('./lib/worker.js', import.meta.url)
  const worker = new Worker(workerUrl)

  let ready = false
  let stopWait = false

  trifidEvents.on('close', async () => {
    logger.debug('Got "close" event from Trifid ; closing worker…')
    await worker.terminate()
    logger.debug('Worker terminated')
  })

  worker.on('message', async (message) => {
    const { type, data } = message
    if (type === 'log') {
      logger.debug(data)
    }
    if (type === 'ready') {
      if (!data) {
        logger.error('There was an error in the worker during initialization.')
      }
      ready = data
      stopWait = true
    }
  })

  worker.on('error', (error) => {
    ready = false
    logger.error(`Error from worker: ${error.message}`)
  })

  worker.on('exit', (code) => {
    ready = false
    logger.info(`Worker exited with code ${code}`)
  })

  worker.postMessage({
    type: 'config',
    data: {
      contentType, url, baseIri, graphName, unionDefaultGraph,
    },
  })

  /**
   * Send the query to the worker and wait for the response.
   *
   * @param {string} query The SPARQL query
   * @returns {Promise<{ response: string, contentType: string }>} The response and its content type
   */
  const handleQuery = async (query) => {
    return new Promise((resolve, reject) => {
      if (!ready) {
        return reject(new Error('Worker is not ready'))
      }

      const queryId = uuidv4()

      const timeoutId = setTimeout(() => {
        worker.off('message', messageHandler)
        reject(new Error(`Query timed out after ${queryTimeout / 1000} seconds`))
      }, queryTimeout)

      worker.postMessage({
        type: 'query',
        data: {
          queryId,
          query,
        },
      })

      const messageHandler = (message) => {
        const { type, data } = message
        if (type === 'query' && data.queryId === queryId) {
          clearTimeout(timeoutId)
          worker.off('message', messageHandler)
          if (!data.success) {
            reject(new Error(data.response))
            return
          }
          resolve(data)
        }
      }

      worker.on('message', messageHandler)
    })
  }

  // Wait for the worker to become ready, so we can be sure it can handle queries
  await waitForVariableToBeTrue(
    () => stopWait,
    30000,
    20,
    'Worker did not become ready within 30 seconds',
  )

  if (!ready) {
    await worker.terminate()
    logger.debug('Worker terminated')
    throw new Error('Worker initialization error')
  }

  return {
    defaultConfiguration: async () => {
      return {
        methods: ['GET', 'POST'],
        paths: ['/query'],
      }
    },
    routeHandler: async () => {
      /**
       * Query string type.
       *
       * @typedef {Object} QueryString
       * @property {string} [query] The SPARQL query.
       */

      /**
       * Request body type.
       * @typedef {Object} RequestBody
       * @property {string} [query] The SPARQL query.
       */

      /**
       * Route handler.
       * @param {import('fastify').FastifyRequest<{ Querystring: QueryString, Body: RequestBody}> & { opentelemetry: () => import('@fastify/otel/types/types.d.ts').FastifyOtelRequestContext}} request Request.
       * @param {import('fastify').FastifyReply} reply Reply.
       */
      const handler = async (request, reply) => {
        let query
        const method = request.method
        if (method === 'GET') {
          query = request.query.query
        } else if (method === 'POST') {
          query = request.body.query
          if (!query && request.body) {
            query = request.body
            if (typeof query !== 'string') {
              query = JSON.stringify(query)
            }
          }
        }

        if (!query) {
          reply.status(400).send('Missing query parameter')
          return reply
        }

        queryLogger(`Received query via ${method}:\n${query}`)

        if (request.opentelemetry) {
          const { span } = request.opentelemetry()
          span.setAttribute('db.system', 'sparql')
          span.addEvent('sparql.query', { statement: query })

          sparqlQueryCounter.add(1, { method })
        }

        try {
          const start = performance.now()
          const { response, contentType } = await handleQuery(query)
          const end = performance.now()
          const duration = end - start
          reply.type(contentType)
          reply.header('Server-Timing', `handler-fetch;dur=${duration};desc="Query execution time"`)
          logger.debug(`Sending the following ${contentType} response:\n${response}`)
          reply.status(200).send(response)
        } catch (error) {
          logger.error(error)
          reply.status(500).send(error.message)
          return reply
        }

        return reply
      }
      return handler
    },
  }
}

export default factory
