// @ts-check

import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { resolve } from 'import-meta-resolve'
import fastifyStatic from '@fastify/static'

const currentDir = dirname(fileURLToPath(import.meta.url))

/** @type {import('../core/types/index.js').TrifidPlugin} */
const factory = async (trifid) => {
  const { config, server, render } = trifid
  const {
    template,
    endpointUrl,
    acceptBlankNodes: acceptBlankNodesConfig,
    dataLabelProperty: dataLabelPropertyConfig,
    schemaLabelProperty: schemaLabelPropertyConfig,
    language: languageConfig,
    languages: languagesConfig,
  } = config

  const view = !template ? `${currentDir}/views/graph-explorer.hbs` : template

  // Serve static files for graph-explorer
  const distPath = resolve('graph-explorer/dist/', import.meta.url)
  server.register(fastifyStatic, {
    root: distPath.replace(/^file:\/\//, ''),
    prefix: '/graph-explorer/assets/',
    decorateReply: false,
  })
  server.register(fastifyStatic, {
    root: `${currentDir}/static/`,
    prefix: '/graph-explorer/static/',
    decorateReply: false,
  })

  const endpoint = endpointUrl || '/query'
  const acceptBlankNodes = !!acceptBlankNodesConfig
  const dataLabelProperty = dataLabelPropertyConfig || 'rdfs:label'
  const schemaLabelProperty = schemaLabelPropertyConfig || 'rdfs:label'
  const language = languageConfig || 'en'
  const languages = languagesConfig || [
    { code: 'en', label: 'English' },
    { code: 'de', label: 'German' },
    { code: 'fr', label: 'French' },
    { code: 'it', label: 'Italian' },
  ]

  return {
    defaultConfiguration: async () => {
      return {
        methods: ['GET'],
        paths: [
          '/graph-explorer',
          '/graph-explorer/',
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

        const content = await render(
          request,
          view,
          {
            // Just forward all the config as a string
            graphExplorerConfig: JSON.stringify({
              // Read SPARQL endpoint URL from configuration and resolve with the current full URL
              endpointUrl: new URL(endpoint, fullUrl).href,

              // All other configured options
              acceptBlankNodes,
              dataLabelProperty,
              schemaLabelProperty,
              language,
              languages,
            }).replace(/'/g, "\\'"),
          },
          { title: 'Graph Explorer' },
        )

        reply.type('text/html').send(content)
        return reply
      }
      return handler
    },
  }
}

export default factory
