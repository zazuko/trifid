import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

import { resolve } from 'import-meta-resolve'
import fastifyStatic from '@fastify/static'

const currentDir = dirname(fileURLToPath(import.meta.url))

/** @type {import('trifid-core/types').TrifidPlugin} */
const trifidFactory = async (trifid) => {
  const { config, render, server } = trifid
  const { template, endpointUrl, urlShortener, catalog, defaultQuery, mapKind } = config

  const endpoint = endpointUrl || '/query'
  const view = !template ? `${currentDir}/views/yasgui.hbs` : template

  const catalogOption = catalog || []
  if (!Array.isArray(catalogOption)) {
    throw new Error('"catalog" option must be an array')
  }

  const defaultQueryOption = defaultQuery || ''
  const mapKindOption = mapKind || 'default'
  if (!['default', 'swisstopo'].includes(mapKindOption)) {
    throw new Error('Unsupported map kind')
  }

  // Serve static files for YASGUI
  const yasguiPath = resolve('@zazuko/yasgui/build/', import.meta.url)
  server.register(fastifyStatic, {
    root: yasguiPath.replace(/^file:\/\//, ''),
    prefix: '/yasgui-dist/',
    decorateReply: false,
  })

  // Serve static files for custom plugins
  const pluginsUrl = new URL('build/', import.meta.url)
  const pluginsPath = fileURLToPath(pluginsUrl)
  server.register(fastifyStatic, {
    root: pluginsPath.replace(/^file:\/\//, ''),
    prefix: '/yasgui-plugins/',
    decorateReply: false,
  })

  return {
    defaultConfiguration: async () => {
      return {
        methods: ['GET'],
        paths: [
          '/sparql',
          '/sparql/',
        ],
      }
    },
    routeHandler: async () => {
      /**
       * Route handler.
       * @param {import('fastify').FastifyRequest & { session: Map<string, any> }} request Request.
       * @param {import('fastify').FastifyReply} reply Reply.
       */
      const handler = async (request, reply) => {
        let requestPort = ''
        if (request.port) {
          requestPort = `:${request.port}`
        }
        const fullUrl = `${request.protocol}://${request.hostname}${requestPort}${request.url}`
        const fullUrlObject = new URL(fullUrl)
        const fullUrlPathname = fullUrlObject.pathname

        // Enforce trailing slash
        if (fullUrlPathname.slice(-1) !== '/') {
          reply.redirect(`${fullUrlPathname}/`)
          return reply
        }

        // Read SPARQL endpoint URL from configuration and resolve with full URL
        const endpointUrl = new URL(endpoint, fullUrl)

        const catalogueEndpoints = JSON.stringify([
          ...catalogOption,
          endpointUrl,
        ])

        const content = await render(
          request,
          view,
          {
            endpointUrl: endpointUrl.toString(),
            catalogueEndpoints,
            urlShortener,
            mapKind: mapKindOption,
            defaultQuery: JSON.stringify(defaultQueryOption),
          },
          { title: 'YASGUI' },
        )

        reply.type('text/html').send(content)
        return reply
      }
      return handler
    },
  }
}

export default trifidFactory
