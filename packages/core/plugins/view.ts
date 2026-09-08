import { access, stat } from 'node:fs/promises';
import { constants } from 'node:fs';

import type { FastifyReply, FastifyRequest } from 'fastify';

import type { ConfigRecord, TrifidPlugin } from '../types/index.ts';
import type { Logger } from 'pino';

/**
 * Report an unusable template file.
 *
 * The template is only read when a request comes in, so a path that is missing
 * or cannot be read would otherwise stay unnoticed until the route is hit and
 * answers with a 500.
 *
 * @param logger Logger instance.
 * @param path The configured template path.
 */
const checkTemplateFile = async (logger: Logger | undefined, path: string) => {
  try {
    await access(path, constants.R_OK);

    const stats = await stat(path);
    if (!stats.isFile()) {
      logger?.error(`the template path '${path}' is not a file`);
    }
  } catch (error) {
    const { code } = error as NodeJS.ErrnoException;

    if (code === 'ENOENT') {
      logger?.error(`the template file '${path}' does not exist`);
    } else if (code === 'EACCES') {
      logger?.error(`the template file '${path}' cannot be read (permission denied)`);
    } else {
      logger?.error(`the template file '${path}' cannot be used: ${(error as Error).message}`);
    }
  }
};

/**
 * Render a specific template file.
 *
 * Configuration fields:
 *  - path (string, required): the path to the template file to load
 *  - context (object, optional): context to give to this specific template file (some variables)
 *  - options (object, optional): options to pass to the Trifid render function (change the title of the page, …)
 */
const factory: TrifidPlugin = async (trifid) => {
  const { config, render, logger } = trifid;
  const { path } = config;

  if (typeof path !== 'string' || !path) {
    logger?.error("configuration is missing 'path' field");
    throw new Error("configuration is missing 'path' field");
  }

  await checkTemplateFile(logger, path);

  const context: ConfigRecord =
    config.context && typeof config.context === 'object' ? (config.context as ConfigRecord) : {};
  const options: ConfigRecord =
    config.options && typeof config.options === 'object' ? (config.options as ConfigRecord) : {};

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
       * @param request Request.
       * @param reply Reply.
       */
      const handler = async (request: FastifyRequest, reply: FastifyReply) => {
        reply
          .status(200)
          .type('text/html')
          .send(await render(request, path, { ...context }, options));
        return reply;
      };
      return handler;
    },
  };
};

export default factory;
