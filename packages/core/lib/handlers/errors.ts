import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'

/**
 * Error handler.
 *
 * @param error Error.
 * @param request Request.
 * @param reply Reply.
 */
const handler = async (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  request.log.error(error)

  let statusCode = error.statusCode || 500

  // Handle the case where there is an error, but no specific status code has been set
  if (statusCode < 400) {
    statusCode = 500
  }

  reply.status(500).send('Internal Server Error')
}

export default handler
