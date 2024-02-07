// @ts-check

import { parentPort } from 'node:worker_threads'
import { readFile } from 'node:fs/promises'
import { resolve as pathResolve } from 'node:path'

import oxigraph from 'oxigraph'

import { performOxigraphQuery } from './query.js'

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

// Create a store
const store = new oxigraph.Store()
parentPort.postMessage(JSON.stringify({
  type: 'log',
  data: 'Created store',
}))

// Handle configuration
const handleConfig = async (config) => {
  const { graphName, unionDefaultGraph, url, contentType, baseIri } = config
  let graphNameIri = graphName
  if ((typeof unionDefaultGraph === 'boolean' && unionDefaultGraph) || unionDefaultGraph === 'true') {
    graphNameIri = oxigraph.defaultGraph()
  }

  // Read data from file or URL
  const data = await getContent(url)
  parentPort.postMessage(JSON.stringify({
    type: 'log',
    data: `Loaded ${data.length} bytes of data from ${url}`,
  }))

  // Load the data into the store
  store.load(data, contentType, baseIri, graphNameIri)
  parentPort.postMessage(JSON.stringify({
    type: 'log',
    data: 'Loaded data into store',
  }))
}

// Handle query
const handleQuery = async (data) => {
  const { query, queryId } = data
  const { response, contentType } = await performOxigraphQuery(store, query)
  parentPort.postMessage(JSON.stringify({
    type: 'query',
    data: {
      queryId,
      response,
      contentType,
    },
  }))
}

parentPort.on('message', async (event) => {
  if (!event) {
    return
  }

  const parsedData = JSON.parse(`${event}`)
  if (!parsedData || !parsedData.type) {
    return
  }

  switch (parsedData.type) {
    case 'config':
      await handleConfig(parsedData.data)
      break
    case 'query':
      await handleQuery(parsedData.data)
      break
  }
})
