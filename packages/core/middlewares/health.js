// @ts-check

/**
 * Health route handler.
 *
 * @param {import('fastify').FastifyRequest} request Request.
 * @param {import('fastify').FastifyReply} reply Reply.
 */
const healthRouteHandler = async (request, reply) => {
  request.log.debug('reached health endpoint')
  reply.type('text/plain').send('OK\n')
}

/** @type {import('../types/index.js').TrifidMiddleware} */
const factory = async (_trifid) => {
  return {
    defaultConfiguration: async () => {
      return {
        paths: ['/healthz'],
        methods: ['GET'],
      }
    },
    routeHandler: async () => {
      return healthRouteHandler
    }
  }
}

export default factory
