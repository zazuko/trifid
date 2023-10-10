/**
 * Health middleware.
 *
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 * @returns {Promise<void>}
 */
const healthMiddleware = async (request, reply) => {
  request.log.debug('Some info about the current request')
  reply
    .code(200)
    .header('Content-Type', 'text/plain; charset=utf-8')
    .send('OK')
}

export default healthMiddleware
