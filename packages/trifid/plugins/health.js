// @ts-check

/**
 * Health plugin.
 *
 * @param {import('fastify').FastifyRequest} request Fastify request
 * @param {import('fastify').FastifyReply} reply Fastify reply
 * @returns {Promise<void>}
 */
const healthPlugin = async (request, reply) => {
  request.log.debug('Some info about the current request')
  reply
    .code(200)
    .header('Content-Type', 'text/plain; charset=utf-8')
    .send('OK')
}

/** @type {import('../types/plugin.d.ts').TrifidPlugin}'} */
const trifidPlugin = async () => {
  return {
    routeOptions: {
      method: 'GET',
      url: '/healthz',
      handler: healthPlugin,
    },
  }
}
export default trifidPlugin
