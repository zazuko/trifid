import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { resolve } from 'import-meta-resolve'
import fastifyStatic from '@fastify/static'

const __dirname = dirname(fileURLToPath(import.meta.url))

const defaults = {
  template: join(__dirname, 'views/index.hbs'),
}

const defaultOptions = {
  url: null,
  user: null,
  password: null,
  graph: null,
  prefixes: [],
  forceIntrospection: false,
}

/**
 * Create Plugin.
 *
 * @param {import('fastify').FastifyInstance} server
 * @param {*} config
 * @param {*} render
 * @returns
 */
const createPlugin = async (server, config, render) => {
  const options = { ...defaultOptions, ...(config || {}) }
  const spexOptions = {
    sparqlEndpoint: options.url,
    username: options.user,
    password: options.password,
    forceIntrospection: options.forceIntrospection,
    namedGraph: options.graph,
    prefixes: options.prefixes,
  }
  config = { ...defaults, ...config, spexOptions }

  // Serve static files from SPEX dist folder
  const distPath = dirname(resolve('@zazuko/spex', import.meta.url))
  server.register(fastifyStatic, {
    root: distPath.replace(/^file:\/\//, ''),
    prefix: '/spex/static/',
    decorateReply: false,
  })

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

    // Create an absolute URL if a relative URL is provided
    spexOptions.sparqlEndpoint = new URL(
      spexOptions.sparqlEndpoint || '/query',
      fullUrl,
    ).toString()

    const content = await render(
      request,
      config.template,
      {
        options: JSON.stringify(spexOptions),
      },
      { title: 'SPEX' },
    )

    reply.type('text/html').send(content)
    return reply
  }
  return handler
}

/** @type {import('../core/types/index.js').TrifidPlugin} */
const trifidFactory = async (trifid) => {
  const { server, config, render } = trifid

  return {
    defaultConfiguration: async () => {
      return {
        methods: ['GET'],
        paths: [
          '/spex',
          '/spex/',
        ],
      }
    },
    routeHandler: async () => createPlugin(server, config, render),
  }
}

export default trifidFactory
export { createPlugin }
