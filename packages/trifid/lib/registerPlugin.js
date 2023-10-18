// @ts-check

/**
 * Register a Trifid plugin.
 *
 * @param {import('fastify').FastifyInstance} fastifyInstance Fastify instance
 * @param {import('../types/plugin.d.ts').TrifidPlugin} trifidPlugin Trifid plugin
 * @returns {Promise<void>}
 */
export const registerPlugin = async (fastifyInstance, trifidPlugin) => {
  const { plugin, pluginOptions, routeOptions } = await trifidPlugin()

  if (plugin) {
    fastifyInstance.register(plugin, pluginOptions)
  }

  if (routeOptions) {
    fastifyInstance.route(routeOptions)
  }
}
