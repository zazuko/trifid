import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { parsers } from '@rdfjs/formats-common'

import rdf from '@zazuko/env'
import { sparqlSerializeQuadStream, sparqlSupportedTypes, sparqlGetRewriteConfiguration } from 'trifid-core'
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

const replaceIriInQuery = (query, iri) => {
  return query.split('{{iri}}').join(iri)
}

const factory = async (trifid) => {
  const { render, logger, config, query } = trifid
  const entityRenderer = createEntityRenderer({ options: config, logger, query })
  const metadataProvider = createMetadataProvider({ options: config })

  const { path, ignorePaths, rewrite: rewriteConfigValue, datasetBaseUrl } = config
  const entityTemplatePath = path || `${currentDir}/views/render.hbs`
  const rewriteConfig = sparqlGetRewriteConfiguration(rewriteConfigValue, datasetBaseUrl)
  const { rewrite: rewriteValue, replaceIri, iriOrigin } = rewriteConfig
  logger.debug(`Rewriting is ${rewriteValue ? 'enabled' : 'disabled'}`)

  if (rewriteValue) {
    if (!datasetBaseUrl.endsWith('/')) {
      logger.warn('The value for `datasetBaseUrl` should usually end with a `/`')
    }
    logger.debug(`Using '${datasetBaseUrl}' as dataset base URL`)
  }

  // If `ignorePaths` is not provided or invalid, we configure some defaults values
  let ignoredPaths = ignorePaths
  if (!ignorePaths || !Array.isArray(ignorePaths)) {
    ignoredPaths = ['/query']
  }

  return {
    defaultConfiguration: async () => {
      return {
        methods: ['GET'],
        paths: ['/*'],
      }
    },
    routeHandler: async () => {
      /**
       * Route handler.
       * @param {import('fastify').FastifyRequest} request Request.
       * @param {import('fastify').FastifyReply} reply Reply.
       */
      const handler = async (request, reply) => {
        const currentPath = request.url.split('?')[0]
        // Check if it is a path that needs to be ignored (check of type is already done at the load of the middleware)
        if (ignoredPaths.includes(currentPath)) {
          reply.callNotFound()
          return
        }

        // Get the expected format from the Accept header or from the `format` query parameter
        const acceptHeader = getAcceptHeader(request)

        // Generate the IRI we expect
        const fullUrl = `${request.protocol}://${request.hostname}${request.raw.url}`
        const iriUrl = new URL(fullUrl)
        iriUrl.search = ''
        iriUrl.searchParams.forEach((_value, key) => iriUrl.searchParams.delete(key))
        const iriUrlString = iriUrl.toString()
        const iri = replaceIri(iriUrlString)
        logger.debug(`IRI value: ${iri}${rewriteValue ? ' (rewritten)' : ''}`)
        const rewriteResponse = rewriteValue
          ? [
            { find: datasetBaseUrl, replace: iriOrigin(iriUrlString) },
          ]
          : []

        // Check if the IRI exists in the dataset
        // @TODO: allow the user to configure the query
        const askQuery = 'ASK { <{{iri}}> ?p ?o }'
        const exists = await query(replaceIriInQuery(askQuery, iri), { ask: true })
        if (!exists) {
          reply.callNotFound()
          return
        }

        try {
          // Get the entity from the dataset
          // @TODO: allow the user to configure the query
          const describeQuery = 'DESCRIBE <{{iri}}>'
          const entity = await query(replaceIriInQuery(describeQuery, iri), {
            ask: false,
            rewriteResponse,
          })
          const entityContentType = entity.contentType || 'application/n-triples'
          const entityStream = entity.response
          if (!entityStream) {
            reply.callNotFound()
            return
          }

          // Make sure the Content-Type is lower case and without parameters (e.g. charset)
          const fixedContentType = entityContentType.split(';')[0].trim().toLocaleLowerCase()

          const quadStream = parsers.import(fixedContentType, entityStream)

          if (sparqlSupportedTypes.includes(acceptHeader)) {
            const serialized = await sparqlSerializeQuadStream(quadStream, acceptHeader)
            reply.type(acceptHeader).send(serialized)
            return
          }

          const dataset = await rdf.dataset().import(quadStream)

          const { entityHtml, entityLabel, entityUrl } = await entityRenderer(
            request,
            {
              dataset,
              rewriteResponse,
              replaceIri,
              entityRoot: rewriteValue ? iri.replace(datasetBaseUrl, iriOrigin(iriUrlString)) : iri,
            },
          )
          const metadata = await metadataProvider(request, { dataset })

          reply.type('text/html').send(await render(entityTemplatePath, {
            dataset: entityHtml,
            locals: {},
            entityLabel,
            entityUrl,
            metadata,
            config,
          }))
        } catch (e) {
          logger.error(e)
          reply.callNotFound()
        }
      }
      return handler
    },
  }
}

export default factory
