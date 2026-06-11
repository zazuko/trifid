import type { FastifyReply, FastifyRequest } from 'fastify'

import type { TrifidPlugin } from '../types/index.ts'

/**
 * Health route handler.
 *
 * @param request Request.
 * @param reply Reply.
 */
const healthRouteHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  request.log.debug('reached health endpoint')
  reply.type('text/plain').send('OK\n')
  return reply
}

const factory: TrifidPlugin = async (_trifid) => {
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
