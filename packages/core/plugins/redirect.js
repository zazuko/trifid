// @ts-check

/** @type {import('../types/index.js').TrifidPlugin} */
const factory = async (trifid) => {
  const { config, logger } = trifid
  const { target } = config
  if (!target) {
    throw new Error("configuration is missing 'target' field")
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
        logger.debug(`redirect to: ${target}`)
        reply.redirect(target)
        return reply
      }
      return handler
    },
  }
}

export default factory
