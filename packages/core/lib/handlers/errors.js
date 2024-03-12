// @ts-check

/**
 * Error handler.
 *
 * @param {import('fastify').FastifyError} error Error.
 * @param {import('fastify').FastifyRequest} request Request.
 * @param {import('fastify').FastifyReply} reply Reply.
 */
const handler = async (error, request, reply) => {
  request.log.error(error)

  let statusCode = error.statusCode || 500

  // Handle the case where there is an error, but no specific status code has been set
  if (statusCode < 400) {
    statusCode = 500
  }

  reply.status(500).send('Internal Server Error')
}

export default handler
