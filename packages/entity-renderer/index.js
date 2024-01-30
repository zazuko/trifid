/* eslint-disable no-template-curly-in-string */
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { parsers } from '@rdfjs/formats-common'
import formats from '@rdfjs-elements/formats-pretty'
import absoluteUrl from 'absolute-url'
import ParsingClient from 'sparql-http-client/ParsingClient.js'
import SimpleClient from 'sparql-http-client/SimpleClient.js'

import rdf from '@zazuko/env'
import { createEntityRenderer } from './renderer/entity.js'
import { createMetadataProvider } from './renderer/metadata.js'

const currentDir = dirname(fileURLToPath(import.meta.url))

const supportedTypes = [
  'application/ld+json',
  'application/n-triples',
  'application/rdf+xml',
  'text/turtle',
  'application/trig',
  'text/csv',
]

const getAcceptHeader = (req) => {
  const queryStringValue = req.query.format

  const supportedQueryStringValues = {
    ttl: 'text/turtle',
    jsonld: 'application/ld+json',
    xml: 'application/rdf+xml',
    nt: 'application/n-triples',
    trig: 'application/trig',
    csv: 'text/csv',
  }

  if (
    Object.hasOwnProperty.call(supportedQueryStringValues, queryStringValue)
  ) {
    return supportedQueryStringValues[queryStringValue]
  }

  return `${req.headers.accept || ''}`.toLocaleLowerCase()
}

/**
 * Convert a JSON-LD object to a CSV string.
 * Works for simple JSON-LD objects got from a DESCRIBE query.
 *
 * @param {Object} jsonLD JSON-LD object to convert to CSV
 * @returns {string} CSV string
 */
const jsonLDToCSV = (jsonLD) => {
  const rows = ['"key","value"']

  // Process a value and add it to the rows array
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

const replaceIriInQuery = (query, iri) => {
  return query.split('{{iri}}').join(iri)
}

/**
 * Serialize a formatted stream to a string.
 *
 * @param {import('@rdfjs/types').Stream<import('@rdfjs/types').Quad> | null} quadStream
 * @returns {Promise<string>} The serialized string.
 */
const serializeFormattedStream = async (quadStream) => {
  if (quadStream === null) {
    throw new Error('No quad stream available')
  }

  let serialized = ''
  for await (const chunk of quadStream) {
    serialized += chunk
  }
  return serialized
}

const factory = async (trifid) => {
  const { render, logger, config } = trifid
  const entityRenderer = createEntityRenderer({ options: config, logger })
  const metadataProvider = createMetadataProvider({ options: config })

  const { path, ignorePaths } = config
  const entityTemplatePath = path || `${currentDir}/views/render.hbs`

  // if `ignorePaths` is not provided or invalid, we configure some defaults values
  let ignoredPaths = ignorePaths
  if (!ignorePaths || !Array.isArray(ignorePaths)) {
    ignoredPaths = ['/query']
  }

  return async (req, res, next) => {
    // Check if it is a path that needs to be ignored (check of type is already done at the load of the middleware)
    if (ignoredPaths.includes(req.path)) {
      return next()
    }

    // Get the expected format from the Accept header or from the `format` query parameter
    const acceptHeader = getAcceptHeader(req)

    // Generate the IRI we expect
    const iriUrl = new URL(encodeURI(absoluteUrl(req)))
    iriUrl.search = ''
    iriUrl.searchParams.forEach((_value, key) => iriUrl.searchParams.delete(key))
    const iri = iriUrl.toString()
    logger.debug(`IRI value: ${iri}`)

    // @TODO: allow the user to configure the endpoint URL
    const endpointUrl = new URL('/query', absoluteUrl(req))
    const endpointUrlAsString = endpointUrl.toString()

    const sparqlClientAsk = new ParsingClient({ endpointUrl: endpointUrlAsString })
    const sparqlClient = new SimpleClient({ endpointUrl: endpointUrlAsString })

    // Check if the IRI exists in the dataset
    // @TODO: allow the user to configure the query
    const askQuery = 'ASK { <{{iri}}> ?p ?o }'
    const exists = await sparqlClientAsk.query.ask(replaceIriInQuery(askQuery, iri))
    if (!exists) {
      return next()
    }

    try {
      // Get the entity from the dataset
      // @TODO: allow the user to configure the query
      const describeQuery = 'DESCRIBE <{{iri}}>'
      const entity = await sparqlClient.query.construct(replaceIriInQuery(describeQuery, iri))
      const entityContentType = entity.headers.get('Content-Type') || 'application/n-triples'
      const entityStream = entity.body
      if (!entityStream) {
        return next()
      }

      // Make sure the Content-Type is lower case and without parameters (e.g. charset)
      const fixedContentType = entityContentType.split(';')[0].trim().toLocaleLowerCase()

      const quadStream = parsers.import(fixedContentType, entityStream)

      if (supportedTypes.includes(acceptHeader)) {
        const isCsv = acceptHeader === 'text/csv'
        const serializerMimeType = isCsv ? 'application/ld+json' : acceptHeader
        const formatted = formats.serializers.import(serializerMimeType, quadStream)
        let serialized = await serializeFormattedStream(formatted)
        // Pretty print JSON-LD
        if (serializerMimeType === 'application/ld+json') {
          serialized = JSON.stringify(JSON.parse(serialized), null, 2)
        }
        if (isCsv) {
          serialized = jsonLDToCSV(JSON.parse(serialized))
        }
        res.setHeader('Content-Type', acceptHeader)
        res.send(serialized)
        return
      }

      const dataset = await rdf.dataset().import(quadStream)

      const { entityHtml, entityLabel, entityUrl } = await entityRenderer(
        req,
        res,
        { dataset },
      )
      const metadata = await metadataProvider(req, { dataset })

      res.setHeader('Content-Type', 'text/html')
      res.send(await render(entityTemplatePath, {
        dataset: entityHtml,
        locals: res.locals,
        entityLabel,
        entityUrl,
        metadata,
        config,
      }))
    } catch (e) {
      logger.error(e)
      return next()
    }
  }
}

export default factory
