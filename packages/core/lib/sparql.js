// @ts-check

import replaceStream from 'string-replace-stream'
import formats from '@rdfjs-elements/formats-pretty'
import ParsingClient from 'sparql-http-client/ParsingClient.js'
import SimpleClient from 'sparql-http-client/SimpleClient.js'

/**
 * Supported types for the serialization.
 */
export const supportedTypes = [
  'application/ld+json',
  'application/n-triples',
  'application/rdf+xml',
  'text/turtle',
  'application/trig',
  'text/csv',
]

/**
 * Convert a JSON-LD object to a CSV string.
 * Works for simple JSON-LD objects got from a DESCRIBE query.
 *
 * @param {Object} jsonLD JSON-LD object to convert to CSV
 * @returns {string} CSV string
 */
const jsonLDToCSV = (jsonLD) => {
  const rows = ['"key","value"']

  /**
   * Process a value and add it to the rows array.
   *
   * @param {string} key Key of the value.
   * @param {any} value Value to process.
   */
  const processValue = (key, value) => {
    if (Array.isArray(value)) {
      // For each array item, check if it's an object with '@id', else use the item directly
      value.forEach(item => {
        const itemValue = (item && typeof item === 'object' && item['@id']) ? item['@id'] : item
        rows.push(`"${key.replace(/"/g, '""')}","${itemValue.toString().replace(/"/g, '""')}"`)
      })
    } else if (value && typeof value === 'object' && value['@id']) {
      // Handle object with '@id'
      rows.push(`"${key.replace(/"/g, '""')}","${value['@id'].replace(/"/g, '""')}"`)
    } else {
      // Handle other values (null/undefined will become empty strings)
      rows.push(`"${key.replace(/"/g, '""')}","${(value || '').toString().replace(/"/g, '""')}"`)
    }
  }

  // Process each entry of the JSON-LD object
  for (const key in jsonLD) {
    if (Object.prototype.hasOwnProperty.call(jsonLD, key)) {
      processValue(key, jsonLD[key])
    }
  }

  // Add an empty row to make sure the CSV is ending with a blank line
  rows.push('')

  return rows.join('\n')
}

/**
 * Serialize a formatted stream to a string.
 *
 * @param {import('@rdfjs/types').Stream<import('@rdfjs/types').Quad> | import('node:stream').EventEmitter | null} quadStream
 * @returns {Promise<string>} The serialized string.
 */
export const serializeFormattedStream = async (quadStream) => {
  if (quadStream === null) {
    throw new Error('No quad stream available')
  }

  let serialized = ''
  // @ts-ignore
  for await (const chunk of quadStream) {
    serialized += chunk
  }
  return serialized
}

/**
 * Serialize a quad stream to a string.
 *
 * @param {import('@rdfjs/types').Stream<import('@rdfjs/types').Quad> | null} quadStream The quad stream to serialize.
 * @param {string} mimeType The mime type to serialize to.
 * @param {Object?} _options Options (reserved for further use).
 * @returns {Promise<string>} The serialized string.
 */
export const serializeQuadStream = async (quadStream, mimeType, _options = {}) => {
  const isCsv = mimeType === 'text/csv'
  const serializerMimeType = isCsv ? 'application/ld+json' : mimeType
  const formatted = formats.serializers.import(serializerMimeType, quadStream)
  let serialized = await serializeFormattedStream(formatted)
  // Pretty print JSON-LD
  if (serializerMimeType === 'application/ld+json') {
    serialized = JSON.stringify(JSON.parse(serialized), null, 2)
  }
  if (isCsv) {
    serialized = jsonLDToCSV(JSON.parse(serialized))
  }
  return serialized
}

/**
 * Compute the value for the `rewrite` option.
 *
 * @param {*} value The value from the configuration (ideally: true, false or auto ; default="auto").
 * @param {string} [datasetBaseUrl] The dataset base URL to use in case rewriting is enabled.
 * @returns {boolean} The computed value of the `rewrite` option.
 */
const getRewriteOptionValue = (value, datasetBaseUrl) => {
  const jsonValue = JSON.stringify(`${value}`.toLocaleLowerCase())

  if (jsonValue === '"false"') {
    return false
  }

  if (jsonValue === '"true"') {
    // Check if `datasetBaseUrl` is a valid URL if present
    if (datasetBaseUrl) {
      try {
        new URL(datasetBaseUrl) // eslint-disable-line no-new
      } catch (_e) {
        throw new Error(
          `The current value you have for 'datasetBaseUrl' is '${datasetBaseUrl}', which is not a valid URL.`,
        )
      }
    } else {
      throw new Error('Rewriting is enabled but no datasetBaseUrl is configured.')
    }

    return true
  }

  // Let's assume that we are in "auto" mode.

  // Check if `datasetBaseUrl` is a valid URL if present
  if (datasetBaseUrl) {
    try {
      new URL(datasetBaseUrl) // eslint-disable-line no-new
      return true
    } catch (_e) {
      // Don't throw in case of an invalid URL
      return false
    }
  }

  return false
}

/**
 * Compute the value for the `rewrite` option and the `datasetBaseUrl`.
 *
 * @param {*} value The value from the configuration (ideally: true, false or auto ; default="auto").
 * @param {string} [datasetBaseUrl] The dataset base URL to use in case rewriting is enabled.
 * @returns {{ rewrite: boolean, datasetBaseUrl: string | null, replaceIri: (iri: string) => string, iriOrigin: (iri: string) => string}} The computed value of the `rewrite` option.
 */
export const getRewriteConfiguration = (value, datasetBaseUrl) => {
  const iriOrigin = (iri) => {
    const parts = new URL(iri)
    parts.pathname = '/'
    parts.search = ''
    parts.username = ''
    parts.password = ''

    return parts.toString()
  }

  const rewriteValue = getRewriteOptionValue(value, datasetBaseUrl)
  if (!rewriteValue) {
    return {
      rewrite: false,
      datasetBaseUrl: null,
      replaceIri: (iri) => iri,
      iriOrigin,
    }
  }

  const datasetBaseUrlValue = new URL(datasetBaseUrl)
  datasetBaseUrlValue.search = ''
  datasetBaseUrlValue.searchParams.forEach((_value, key) => datasetBaseUrlValue.searchParams.delete(key))
  const datasetBaseUrlString = datasetBaseUrlValue.toString()

  return {
    rewrite: rewriteValue,
    datasetBaseUrl: datasetBaseUrlString,
    replaceIri: (iri) => iri.replace(iriOrigin(iri), datasetBaseUrlString),
    iriOrigin,
  }
}

/**
 * @typedef {Object} QueryResult
 * @property {any} response The response body.
 * @property {string} contentType The response content type.
 */

/**
 * @typedef {Object} RewriteResponseOptions
 * @property {string} find The string to find.
 * @property {string} replace The string to replace with.
 */

/**
 * @typedef {Object} QueryOptions
 * @property {boolean} [ask] Is it a ASK query?
 * @property {boolean} [select] Is it a SELECT query?
 * @property {Record<string, string>} [headers] Headers to use in the request.
 * @property {Array<RewriteResponseOptions>} [rewriteResponse] Replace strings in the response.
 */

/**
 * @typedef {Object} SPARQLClient
 * @property {{parsing: ParsingClient, simple: SimpleClient}} clients Supported clients.
 * @property {(query: string, options?: QueryOptions) => Promise<QueryResult | Array<import('sparql-http-client/ResultParser.js').ResultRow> | boolean>} query Query function.
 */

/**
 * Generate a SPARQL client.
 *
 * @param {string} sparqlEndpoint The SPARQL endpoint URL.
 * @param {QueryOptions} options Options.
 * @returns {SPARQLClient} The SPARQL client.
 */
export const generateClient = (sparqlEndpoint, options) => {
  const clients = {
    parsing: new ParsingClient({ endpointUrl: sparqlEndpoint, ...options }),
    simple: new SimpleClient({ endpointUrl: sparqlEndpoint, ...options }),
  }

  /**
   *
   * @param {string} query The SPARQL query to use.
   * @param {QueryOptions?} [options] Query options.
   * @returns {Promise<QueryResult | Array<import('sparql-http-client/ResultParser.js').ResultRow> | boolean>} The quad stream or boolean for ASK queries.
   */
  const query = async (query, options = {}) => {
    const isAsk = options && options.ask
    const isSelect = options && options.select
    const headers = (options && options.headers) || {}
    const rewriteResponse = (options && options.rewriteResponse) || []

    if (isAsk) {
      return await clients.parsing.query.ask(query, { headers })
    }

    if (isSelect) {
      const selectResults = await clients.parsing.query.select(query, { headers })
      const replacedSelectResults = selectResults.map((row) => {
        for (const key in row) {
          if (!Object.prototype.hasOwnProperty.call(row, key) || !row[key].value) {
            continue
          }

          let value = row[key].value
          if (typeof value !== 'string') {
            continue
          }

          for (const replacement of rewriteResponse) {
            value = value.replace(replacement.find, replacement.replace)
          }
          row[key].value = value
        }
        return row
      })
      return replacedSelectResults
    }

    const result = await clients.simple.query.construct(query, { headers })
    const contentType = result.headers.get('Content-Type') || 'application/n-triples'
    const body = result.body

    // Function to apply all replacements in sequence
    const applyReplacements = (stream, replacements) => {
      let pipeline = stream
      for (const replacement of replacements) {
        pipeline = pipeline.pipe(replaceStream(replacement.find, replacement.replace))
      }
      return pipeline
    }

    return {
      response: applyReplacements(body, rewriteResponse),
      contentType,
    }
  }

  return {
    clients,
    query,
  }
}

/**
 * SPARQL Endpoint configuration.
 *
 * @typedef {Object} SPARQLEndpointConfig
 * @property {string} url SPARQL endpoint URL.
 */

/**
 * Create a SPARQL query function that can be used inside Trifid plugins.
 *
 * @param {import('pino').Logger} logger Logger instance.
 * @param {Record<string, SPARQLEndpointConfig>} configuredEndpoints Configured endpoints.
 * @param {string} instanceHostname Instance hostname, used to resolve relative URLs.
 * @returns {{endpoints: Record<string, SPARQLClient>, query: (pluginLogger: import('pino').Logger) => import('../types/index.js').TrifidQuery}} Query function.
 */
export const initQuery = (logger, configuredEndpoints = {}, instanceHostname) => {
  const endpoints = Object.fromEntries(Object.entries(configuredEndpoints).map(([name, options]) => {
    logger.debug(`Configured following SPARQL endpoint: ${name}`)
    const { url: endpointUrl, ...otherOptions } = options
    const url = new URL(endpointUrl, instanceHostname)
    return [name, generateClient(url.toString(), otherOptions)]
  }))

  /**
   * Execute a SPARQL query.
   *
   * @param {import('pino').Logger} pluginLogger Plugin logger instance.
   * @returns {(query: string, options?: Record<string, any>) => Promise<any>} Query result.
   */
  const query = (pluginLogger) => async (query, options = {}) => {
    pluginLogger.debug(`SPARQL query: \n${query}`)

    const { endpoint: configuredEndpoint, ...otherOptions } = options

    const endpoint = configuredEndpoint || 'default'
    if (!(endpoint in endpoints)) {
      throw new Error(`Unknown SPARQL endpoint: ${endpoint}`)
    }

    return await endpoints[endpoint].query(query, otherOptions)
  }

  return {
    endpoints,
    query,
  }
}
