import type { FastifyReply, FastifyRequest } from 'fastify';

import type { TrifidPlugin } from '../types/index.ts';

const factory: TrifidPlugin = async (trifid) => {
  const { message } = trifid.config;

  let messageToThrow = 'Oops, something went wrong :-(';
  if (message) {
    messageToThrow = String(message);
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
       * @param _reply Reply.
       */
      const handler = async (_request: FastifyRequest, _reply: FastifyReply) => {
        throw new Error(messageToThrow);
      };
      return handler;
    },
  };
};

export default factory;
