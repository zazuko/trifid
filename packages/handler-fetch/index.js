// @ts-check

import { Worker } from 'node:worker_threads'
import { v4 as uuidv4 } from 'uuid'

/** @type {import('trifid-core/dist/types/index.d.ts').TrifidMiddleware} */
export const factory = async (trifid) => {
  const { config, logger } = trifid
  const { contentType, url, baseIri, graphName, unionDefaultGraph } = config

  const workerUrl = new URL('./lib/worker.js', import.meta.url)
  const worker = new Worker(workerUrl)

  worker.on('message', async (message) => {
    const { type, data } = JSON.parse(`${message}`)
    if (type === 'log') {
      logger.debug(data)
    }
  })

  worker.on('error', (error) => {
    logger.error(`Error from worker: ${error.message}`)
  })

  worker.on('exit', (code) => {
    logger.info(`Worker exited with code ${code}`)
  })

  worker.postMessage(JSON.stringify({
    type: 'config',
    data: {
      contentType, url, baseIri, graphName, unionDefaultGraph,
    },
  }))

  const handleQuery = async (query) => {
    return new Promise((resolve, _reject) => {
      const queryId = uuidv4()

      worker.postMessage(JSON.stringify({
        type: 'query',
        data: {
          queryId,
          query,
        },
      }))

      worker.on('message', (message) => {
        const { type, data } = JSON.parse(`${message}`)
        if (type === 'query' && data.queryId === queryId) {
          resolve(data)
        }
      })
    })
  }

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
