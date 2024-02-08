// @ts-check

import { Worker } from 'node:worker_threads'
import { v4 as uuidv4 } from 'uuid'
import { waitForVariableToBeTrue } from './lib/utils.js'

/** @type {import('trifid-core/dist/types/index.d.ts').TrifidMiddleware} */
export const factory = async (trifid) => {
  const { config, logger } = trifid
  const { contentType, url, baseIri, graphName, unionDefaultGraph } = config

  const workerUrl = new URL('./lib/worker.js', import.meta.url)
  const worker = new Worker(workerUrl)
  worker.unref()

  let ready = false

  worker.on('online', () => worker.unref())

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
    logger.error(`Error from worker: ${error.message}`)
  })

  worker.on('exit', (code) => {
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
    return new Promise((resolve, _reject) => {
      const queryId = uuidv4()

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

  return async (req, res, _next) => {
    let query
    if (req.method === 'GET') {
      query = req.query.query
    } else if (req.method === 'POST') {
      query = req.body.query || req.body
    }

    if (!query) {
      return res.status(400).send('Missing query parameter')
    }

    logger.debug(`Received query: ${query}`)

    try {
      const { response, contentType } = await handleQuery(query)
      res.set('Content-Type', contentType)
      logger.debug(`Sending the following ${contentType} response:\n${response}`)
      return res.status(200).send(response)
    } catch (error) {
      logger.error(error)
      return res.status(500).send(error.message)
    }
  }
}

export default factory
