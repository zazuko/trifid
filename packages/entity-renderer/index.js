/* eslint-disable no-template-curly-in-string */
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { parsers } from '@rdfjs/formats-common'
import absoluteUrl from 'absolute-url'
import ParsingClient from 'sparql-http-client/ParsingClient.js'
import SimpleClient from 'sparql-http-client/SimpleClient.js'

import rdf from '@zazuko/env'
import { createEntityRenderer } from './renderer/entity.js'
import { createMetadataProvider } from './renderer/metadata.js'

const currentDir = dirname(fileURLToPath(import.meta.url))

const getAcceptHeader = (req) => {
  const queryStringValue = req.query.format

  const supportedQueryStringValues = {
    ttl: 'text/turtle',
    jsonld: 'application/ld+json',
    xml: 'application/rdf+xml',
    nt: 'application/n-triples',
  }

  if (
    Object.hasOwnProperty.call(supportedQueryStringValues, queryStringValue)
  ) {
    return supportedQueryStringValues[queryStringValue]
  }

  return req.headers.accept
}

const replaceIriInQuery = (query, iri) => {
  return query.split('{{iri}}').join(iri)
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
    // check if it is a path that needs to be ignored (check of type is already done at the load of the middleware)
    if (ignoredPaths.includes(req.path)) {
      return next()
    }

    // @TODO: make sure the results is from the specified type
    // eslint-disable-next-line no-unused-vars
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

      // Make sure the Content-Type is lower case and without parameters (e.g. charset)
      const fixedContentType = entityContentType.split(';')[0].trim().toLocaleLowerCase()

      const quadStream = parsers.import(fixedContentType, entityStream)
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
