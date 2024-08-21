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
  return reply
}

/** @type {import('../types/index.js').TrifidPlugin} */
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
    },
  }
}

export default factory
