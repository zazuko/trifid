import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

import { resolve } from 'import-meta-resolve'
import fastifyStatic from '@fastify/static'

const currentDir = dirname(fileURLToPath(import.meta.url))

/** @type {import('../core/types/index.js').TrifidPlugin} */
const trifidFactory = async (trifid) => {
  const { config, render, server } = trifid
  const { template, endpointUrl, urlShortener } = config

  const endpoint = endpointUrl || '/query'
  const view = !template ? `${currentDir}/views/yasgui.hbs` : template

  // Serve static files for YASGUI
  const yasguiPath = resolve('@zazuko/yasgui/build/', import.meta.url)
  server.register(fastifyStatic, {
    root: yasguiPath.replace(/^file:\/\//, ''),
    prefix: '/yasgui-dist/',
    decorateReply: false,
  })

  // Serve static files for openlayers (maps)
  const olPath = resolve('@openlayers-elements/bundle/dist/', import.meta.url)
  server.register(fastifyStatic, {
    root: olPath.replace(/^file:\/\//, ''),
    prefix: '/yasgui-ol/',
    decorateReply: false,
  })

  // Serve static files for custom plugins
  const pluginsUrl = new URL('plugins/', import.meta.url)
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
       * @param {import('fastify').FastifyRequest} request Request.
       * @param {import('fastify').FastifyReply} reply Reply.
       */
      const handler = async (request, reply) => {
        const fullUrl = `${request.protocol}://${request.hostname}${request.raw.url}`
        const fullUrlObject = new URL(fullUrl)
        const fullUrlPathname = fullUrlObject.pathname

        // Enforce trailing slash
        if (fullUrlPathname.slice(-1) !== '/') {
          return reply.redirect(`${fullUrlPathname}/`)
        }

        // Read SPARQL endpoint URL from configuration and resolve with full URL
        const endpointUrl = new URL(endpoint, fullUrl)

        const content = await render(
          view,
          {
            endpointUrl: endpointUrl.toString(),
            urlShortener,
          },
          { title: 'YASGUI' },
        )

        reply.type('text/html').send(content)
      }
      return handler
    },
  }
}

export default trifidFactory
