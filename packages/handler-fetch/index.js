/* eslint-disable no-console */
import { readFile } from 'node:fs/promises'
import { resolve as pathResolve } from 'node:path'

import oxigraph from 'oxigraph'

import { performOxigraphQuery } from './lib/query.js'

/**
 * Fetch file content from URL or path.
 *
 * @param {string} url URL or path to file to fetch.
 * @returns {Promise<string>} File content.
 */
const getContent = async (url) => {
  let content

  if (url.startsWith('http://') || url.startsWith('https://')) {
    const response = await fetch(url)
    content = await response.text()
  } else {
    const resolvedPath = pathResolve(url)
    content = await readFile(resolvedPath, 'utf8')
  }

  return content
}

export const factory = async (trifid) => {
  const { config, logger } = trifid
  const { contentType, url, baseIri, graphName, unionDefaultGraph } = config

  let graphNameIri = graphName
  if ((typeof unionDefaultGraph === 'boolean' && unionDefaultGraph) || unionDefaultGraph === 'true') {
    graphNameIri = oxigraph.defaultGraph()
  }

  // read data from file or URL
  const data = await getContent(url)
  logger.debug(`Loaded ${data.length} bytes of data from ${url}`)

  // create a store and load the data
  const store = new oxigraph.Store()
  store.load(data, contentType, baseIri, graphNameIri)
  logger.debug('Loaded data into store')

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
      const { response, contentType } = await performOxigraphQuery(store, query)
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
