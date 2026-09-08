import fastifyStatic from '@fastify/static';

import { joinSubpath } from '../lib/subpath.ts';

import type { TrifidPlugin } from '../types/index.ts';

const factory: TrifidPlugin = async (trifid) => {
  const { config, paths, subpath } = trifid;
  const { directory } = config;
  if (typeof directory !== 'string' || !directory) {
    throw new Error("configuration is missing 'directory' field");
  }

  const staticConfiguration = {
    root: directory,
    decorateReply: false,
  };
  if (!paths || (Array.isArray(paths) && paths.length === 0)) {
    // Register static file serving for the root path
    trifid.server.register(fastifyStatic, {
      ...staticConfiguration,
      prefix: subpath,
    });
  } else {
    // Register static file serving for each configured path
    paths.forEach((path) => {
      trifid.server.register(fastifyStatic, {
        ...staticConfiguration,
        prefix: joinSubpath(subpath, path),
      });
    });
  }

  return {
    defaultConfiguration: async () => {
      return {
        methods: ['GET'],
        // Serve static files after other routes
        order: 1200,
      };
    },
  };
};

export default factory;
