// @ts-check

/**
 * Render a specific template file.
 *
 * Configuration fields:
 *  - path (string, required): the path to the template file to load
 *  - context (object, optional): context to give to this specific template file (some variables)
 *  - options (object, optional): options to pass to the Trifid render function (change the title of the page, …)
 *
 * @type {import('../types/index.js').TrifidMiddleware}
 */
const factory = async (trifid) => {
  const { config, render } = trifid
  const { path } = config
  let { context, options } = config

  if (!path) {
    throw new Error("configuration is missing 'path' field")
  }

  if (!context) {
    context = {}
  }

  if (!options) {
    options = {}
  }

  return {
    defaultConfiguration: async () => {
      return {
        methods: ['GET'],
      }
    },
    routeHandler: async () => {
      /**
       * Route handler.
       * @param {import('fastify').FastifyRequest} _request Request.
       * @param {import('fastify').FastifyReply} reply Reply.
       */
      const handler = async (_request, reply) => {
        reply.status(200).type('text/html').send(await render(path, { ...context }, options))
      }
      return handler
    },
  }
}

export default factory
