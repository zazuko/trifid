// @ts-check

/** @type {import('../types/index.js').TrifidPlugin} */
const factory = async (trifid) => {
  const { message } = trifid.config

  let messageToThrow = 'Oops, something went wrong :-('
  if (message) {
    messageToThrow = `${message}`
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
       * @param {import('fastify').FastifyReply} _reply Reply.
       */
      const handler = async (_request, _reply) => {
        throw new Error(messageToThrow)
      }
      return handler
    },
  }
}

export default factory
