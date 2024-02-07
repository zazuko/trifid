// @ts-check

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
 * @typedef {Object} QueryResult
 * @property {any} response The response body.
 * @property {string} contentType The response content type.
 */

/**
 * @typedef {Object} QueryOptions
 * @property {boolean?} [ask] Is it a ASK query?
 */

/**
 * @typedef {Object} SPARQLClient
 * @property {{parsing: ParsingClient, simple: SimpleClient}} clients Supported clients.
 * @property {(query: string, options?: QueryOptions) => Promise<QueryResult | boolean>} query Query function.
 */

/**
 * Generate a SPARQL client.
 *
 * @param {string} sparqlEndpoint The SPARQL endpoint URL.
 * @param {Object} options Options.
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
   * @returns {Promise<QueryResult | boolean>} The quad stream or boolean for ASK queries.
   */
  const query = async (query, options = {}) => {
    const isAsk = options && options.ask

    if (isAsk) {
      return await clients.parsing.query.ask(query)
    }

    const result = await clients.simple.query.construct(query)
    const contentType = result.headers.get('Content-Type') || 'application/n-triples'
    const body = result.body

    return {
      response: body,
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
 * Create a SPARQL query function that can be used inside Trifid middlewares.
 *
 * @param {import('pino').Logger} logger Logger instance.
 * @param {Record<string, SPARQLEndpointConfig>} configuredEndpoints Configured endpoints.
 * @param {string} instanceHostname Instance hostname, used to resolve relative URLs.
 * @returns {{endpoints: Record<string, SPARQLClient>, query: (middlewareLogger: import('pino').Logger) => import('../types/index.d.ts').TrifidQuery}} Query function.
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
   * @param {import('pino').Logger} middlewareLogger Middleware logger instance.
   * @returns {(query: string, options?: Record<string, any>) => Promise<any>} Query result.
   */
  const query = (middlewareLogger) => async (query, options = {}) => {
    middlewareLogger.debug(`SPARQL query: \n${query}`)

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
