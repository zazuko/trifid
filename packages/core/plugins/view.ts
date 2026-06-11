import type { FastifyReply, FastifyRequest } from 'fastify'

import type { ConfigRecord, TrifidPlugin } from '../types/index.ts'

/**
 * Render a specific template file.
 *
 * Configuration fields:
 *  - path (string, required): the path to the template file to load
 *  - context (object, optional): context to give to this specific template file (some variables)
 *  - options (object, optional): options to pass to the Trifid render function (change the title of the page, …)
 */
const factory: TrifidPlugin = async (trifid) => {
  const { config, render } = trifid
  const { path } = config

  if (typeof path !== 'string' || !path) {
    throw new Error("configuration is missing 'path' field")
  }

  const context: ConfigRecord = (config.context && typeof config.context === 'object')
    ? config.context as ConfigRecord
    : {}
  const options: ConfigRecord = (config.options && typeof config.options === 'object')
    ? config.options as ConfigRecord
    : {}

  return {
    defaultConfiguration: async () => {
      return {
        methods: ['GET'],
      }
    },
    routeHandler: async () => {
      /**
       * Route handler.
       *
       * @param request Request.
       * @param reply Reply.
       */
      const handler = async (request: FastifyRequest, reply: FastifyReply) => {
        reply.status(200).type('text/html').send(await render(request, path, { ...context }, options))
        return reply
      }
      return handler
    },
  }
}

export default factory
