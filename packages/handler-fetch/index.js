// @ts-check

import { Worker } from 'node:worker_threads'
import { v4 as uuidv4 } from 'uuid'
import { waitForVariableToBeTrue } from './lib/utils.js'

/** @type {import('../core/types/index.d.ts').TrifidMiddleware} */
export const factory = async (trifid) => {
  const { config, logger, trifidEvents } = trifid
  const { contentType, url, baseIri, graphName, unionDefaultGraph } = config

  const queryTimeout = 30000

  const workerUrl = new URL('./lib/worker.js', import.meta.url)
  const worker = new Worker(workerUrl)

  let ready = false

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
      ready = true
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
          resolve(data)
        }
      }

      worker.on('message', messageHandler)
    })
  }

  // Wait for the worker to become ready, so we can be sure it can handle queries
  await waitForVariableToBeTrue(
    () => ready,
    30000,
    20,
    'Worker did not become ready within 30 seconds',
  )

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
       * Route handler.
       * @param {import('fastify').FastifyRequest} request Request.
       * @param {import('fastify').FastifyReply} reply Reply.
       */
      const handler = async (request, reply) => {
        let query
        if (request.method === 'GET') {
          query = request.query.query
        } else if (request.method === 'POST') {
          query = request.body.query || request.body
        }

        if (!query) {
          reply.status(400).send('Missing query parameter')
          return
        }

        logger.debug(`Received query: ${query}`)

        try {
          const { response, contentType } = await handleQuery(query)
          reply.type(contentType)
          logger.debug(`Sending the following ${contentType} response:\n${response}`)
          reply.status(200).send(response)
        } catch (error) {
          logger.error(error)
          reply.status(500).send(error.message)
        }
      }
      return handler
    },
  }
}

export default factory
