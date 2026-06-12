import type { FastifyReply, FastifyRequest } from 'fastify';

import type { TrifidPlugin } from '../types/index.ts';

const factory: TrifidPlugin = async (trifid) => {
  const { config, logger } = trifid;
  const { target } = config;
  if (typeof target !== 'string' || !target) {
    throw new Error('configuration is missing \'target\' field');
  }

  return {
    defaultConfiguration: async () => {
      return {
        methods: ['GET'],
      };
    },
    routeHandler: async () => {
      /**
       * Route handler.
       *
       * @param _request Request.
       * @param reply Reply.
       */
      const handler = async (_request: FastifyRequest, reply: FastifyReply) => {
        logger.debug(`redirect to: ${target}`);
        reply.redirect(target);
        return reply;
      };
      return handler;
    },
  };
};

export default factory;
