import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parsers } from '@rdfjs/formats-common'
import rdf from '@zazuko/env'
import { sparqlSerializeQuadStream, sparqlSupportedTypes, sparqlGetRewriteConfiguration } from 'trifid-core'
import mimeparse from 'mimeparse'

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
    html: 'text/html',
  }

  if (
    Object.hasOwnProperty.call(supportedQueryStringValues, queryStringValue)
  ) {
    return supportedQueryStringValues[queryStringValue]
  }

  const acceptHeader = `${req.headers.accept || ''}`.toLocaleLowerCase()
  const selectedHeader = mimeparse.bestMatch([
    ...sparqlSupportedTypes,
    'text/html',
  ], acceptHeader)

  return selectedHeader || acceptHeader
}

const replaceIriInQuery = (query, iri) => {
  return query.split('{{iri}}').join(iri)
}

const defaultConfiguration = {
  resourceNoSlash: true,
  resourceExistsQuery: 'ASK { <{{iri}}> ?p ?o }',
  resourceGraphQuery: 'DESCRIBE <{{iri}}>',
  containerExistsQuery: 'ASK { ?s a ?o. FILTER REGEX(STR(?s), "^{{iri}}") }',
  containerGraphQuery:
    'CONSTRUCT { ?s a ?o. } WHERE { ?s a ?o. FILTER REGEX(STR(?s), "^{{iri}}") }',
  redirectQuery: `
    PREFIX http2011: <http://www.w3.org/2011/http#>
    PREFIX http2006: <http://www.w3.org/2006/http#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

    SELECT ?req ?res ?location ?responseCode ?validFrom
    WHERE {
      GRAPH ?g {

        # Handle 2011 version
        {
          ?req2011 rdf:type http2011:GetRequest.
          ?req2011 http2011:requestURI <{{iri}}>.
          ?req2011 http2011:response ?res2011.

          ?res2011 rdf:type http2011:Response.
          ?res2011 http2011:location ?location2011.
          ?res2011 http2011:responseCode ?responseCode2011.

          OPTIONAL {
            ?res2011 <http://schema.org/validFrom> ?validFrom2011.
          }
        }

        UNION

        # Handle 2006 version
        {
          ?req2006 rdf:type http2006:GetRequest.
          ?req2006 http2006:requestURI <{{iri}}>.
          ?req2006 http2006:response ?res2006.

          ?res2006 rdf:type http2006:Response.
          ?res2006 http2006:location ?location2006.
          ?res2006 http2006:responseCode ?responseCode2006.

          OPTIONAL {
            ?res2006 <http://schema.org/validFrom> ?validFrom2006.
          }
        }

        # Combine results, using priority for 2011 version over 2006 version
        BIND(COALESCE(?req2011, ?req2006) AS ?req)
        BIND(COALESCE(?res2011, ?res2006) AS ?res)
        BIND(COALESCE(?location2011, ?location2006) AS ?location)
        BIND(COALESCE(?validFrom2011, ?validFrom2006) AS ?validFrom)
        # Just get the response code as a string instead of the full IRI
        BIND(STRAFTER(STR(COALESCE(?responseCode2011, ?responseCode2006)), "#") AS ?responseCode)
      }
    }
    LIMIT 1
  `,
  followRedirects: false,
  enableSchemaUrlRedirect: false, // Experimental
}

const fixContentTypeHeader = (contentType) => {
  return contentType.split(';')[0].trim().toLocaleLowerCase()
}

const factory = async (trifid) => {
  const { render, logger, config, query } = trifid
  const mergedConfig = { ...defaultConfiguration, ...config }
  const entityRenderer = createEntityRenderer({ options: config, logger, query })
  const metadataProvider = createMetadataProvider({ options: config })

  const { path, ignorePaths, rewrite: rewriteConfigValue, datasetBaseUrl } = config
  const entityTemplatePath = path || `${currentDir}/views/render.hbs`
  const rewriteConfig = sparqlGetRewriteConfiguration(rewriteConfigValue, datasetBaseUrl)
  const { rewrite: rewriteValue, replaceIri, iriOrigin } = rewriteConfig

  const additionalRewritesConfig = config.additionalRewrites || []
  if (!Array.isArray(additionalRewritesConfig)) {
    throw new Error('The `additionalRewrites` configuration must be an array')
  }
  const additionalRewrites = additionalRewritesConfig.map((value) => {
    if (typeof value === 'string') {
      return { find: value }
    }
    if (!value || !value.find) {
      throw new Error('Each additional rewrite must have a `find` value')
    }
    return value
  })

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
       * @param {import('fastify').FastifyRequest & { session: Map<string, any> }} request Request.
       * @param {import('fastify').FastifyReply} reply Reply.
       */
      const handler = async (request, reply) => {
        const currentPath = request.url.split('?')[0]
        // Check if it is a path that needs to be ignored (check of type is already done at the load of the plugin)
        if (ignoredPaths.includes(currentPath)) {
          reply.callNotFound()
          return reply
        }

        // To avoid any languge issues, we will forward the i18n cookie to the SPARQL endpoint
        const queryHeaders = {
          cookie: `i18n=${request.session.get('currentLanguage') || 'en'}; Path=/; SameSite=Lax; Secure; HttpOnly`,
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
        const isContainer = mergedConfig.resourceNoSlash && iri.endsWith('/')
        logger.debug(`IRI value: ${iri}${rewriteValue ? ' (rewritten)' : ''} - is container: ${isContainer ? 'true' : 'false'}`)
        const rewriteResponse = rewriteValue
          ? [
            ...additionalRewrites.map(({ find, replace }) => {
              if (!replace) {
                return { find, replace: iriOrigin(iriUrlString) }
              } else {
                return { find, replace }
              }
            }),
            { find: datasetBaseUrl, replace: iriOrigin(iriUrlString) },
          ]
          : []

        // Check if the IRI exists in the dataset
        const askQuery = isContainer ? mergedConfig.containerExistsQuery : mergedConfig.resourceExistsQuery
        const exists = await query(replaceIriInQuery(askQuery, iri), { ask: true, headers: queryHeaders })
        if (!exists) {
          reply.callNotFound()
          return reply
        }

        try {
          // Check if there is a redirect for the IRI
          if (mergedConfig.followRedirects) {
            const redirect = await query(replaceIriInQuery(mergedConfig.redirectQuery, iri), {
              ask: false,
              select: true, // Force the parsing of the response
              rewriteResponse,
            })
            if (redirect.length > 0) {
              const entityRedirect = redirect[0]
              const { responseCode, location } = entityRedirect
              if (responseCode && location && responseCode.value && location.value) {
                logger.debug(`Redirecting <${iri}> to <${location.value}> (HTTP ${responseCode.value})`)
                reply.status(parseInt(responseCode.value, 10)).redirect(location.value)
                return reply
              } else {
                logger.warn('Redirect query did not return the expected results')
              }
            }
          }

          // Get the entity from the dataset
          const describeQuery = isContainer ? mergedConfig.containerGraphQuery : mergedConfig.resourceGraphQuery
          const entity = await query(replaceIriInQuery(describeQuery, iri), {
            ask: false,
            rewriteResponse,
            headers: {
              ...queryHeaders,
              accept: 'application/n-quads',
            },
          })
          const entityContentType = entity.contentType || 'application/n-triples'
          const entityStream = entity.response
          if (!entityStream) {
            reply.callNotFound()
            return reply
          }

          // Make sure the Content-Type is lower case and without parameters (e.g. charset)
          const fixedContentType = fixContentTypeHeader(entityContentType)
          const quadStream = parsers.import(fixedContentType, entityStream)

          if (sparqlSupportedTypes.includes(acceptHeader)) {
            const serialized = await sparqlSerializeQuadStream(quadStream, acceptHeader)
            reply.type(acceptHeader).send(serialized)
            return reply
          }

          const dataset = await rdf.dataset().import(quadStream)

          if (mergedConfig.enableSchemaUrlRedirect && acceptHeader === 'text/html') {
            // Get all triples that have a schema:URL property with value of type xsd:anyURI
            const urls = []
            dataset.match(iriUrlString, rdf.ns.schema.URL)
              .filter(({ object }) => object.datatype.value === 'xsd:anyURI')
              .map(({ object }) => urls.push(object.value))
            if (urls.length > 0) {
              const redirectUrl = urls[0]
              logger.debug(`Redirecting to ${redirectUrl}`)
              reply.redirect(redirectUrl)
              return reply
            }
          }

          const { entityHtml, entityLabel, entityUrl } = await entityRenderer(
            request,
            {
              dataset,
              rewriteResponse,
              replaceIri,
              headers: queryHeaders,
              entityRoot: rewriteValue ? iri.replace(datasetBaseUrl, iriOrigin(iriUrlString)) : iri,
            },
          )
          const metadata = await metadataProvider(request, { dataset })

          reply.type('text/html').send(await render(request, entityTemplatePath, {
            dataset: entityHtml,
            entityLabel,
            entityUrl,
            metadata,
            config,
          }))
        } catch (e) {
          logger.error(e)
          reply.callNotFound()
          return reply
        }

        return reply
      }
      return handler
    },
  }
}

export default factory
