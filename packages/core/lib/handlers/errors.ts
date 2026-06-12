import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

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
  request.log.error(error);

  // Errors are deliberately masked as a generic 500 response, so that no
  // internal details leak to the client.
  reply.status(500).send('Internal Server Error');
};

export default handler;
