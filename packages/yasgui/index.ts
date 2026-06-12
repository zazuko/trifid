import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

import { resolve } from 'import-meta-resolve';
import fastifyStatic from '@fastify/static';

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { TrifidPlugin } from 'trifid-core';

const currentDir = dirname(fileURLToPath(import.meta.url));

const trifidFactory: TrifidPlugin = async (trifid) => {
  const { config, render, server } = trifid;
  const { template, endpointUrl, urlShortener, catalog, defaultQuery, mapKind } = config;

  const endpoint = typeof endpointUrl === 'string' && endpointUrl ? endpointUrl : '/query';
  const view = typeof template === 'string' && template ? template : `${currentDir}/views/yasgui.hbs`;

  const catalogOption = catalog || [];
  if (!Array.isArray(catalogOption)) {
    throw new Error('"catalog" option must be an array');
  }

  const defaultQueryOption = defaultQuery || '';
  const mapKindOption = typeof mapKind === 'string' ? mapKind : 'default';
  if (!['default', 'swisstopo'].includes(mapKindOption)) {
    throw new Error('Unsupported map kind');
  }

  // Serve static files for YASGUI
  const yasguiPath = resolve('@zazuko/yasgui/build/', import.meta.url);
  server.register(fastifyStatic, {
    root: yasguiPath.replace(/^file:\/\//, ''),
    prefix: '/yasgui-dist/',
    decorateReply: false,
  });

  // Serve files from the public directory
  const publicDirectory = new URL('public/', import.meta.url);
  const publicPath = fileURLToPath(publicDirectory);
  server.register(fastifyStatic, {
    root: publicPath.replace(/^file:\/\//, ''),
    prefix: '/yasgui-public/',
    decorateReply: false,
  });

  // Serve static files for custom plugins
  const pluginsUrl = new URL('build/', import.meta.url);
  const pluginsPath = fileURLToPath(pluginsUrl);
  server.register(fastifyStatic, {
    root: pluginsPath.replace(/^file:\/\//, ''),
    prefix: '/yasgui-plugins/',
    decorateReply: false,
  });

  return {
    defaultConfiguration: async () => {
      return {
        methods: ['GET'],
        paths: [
          '/sparql',
          '/sparql/',
        ],
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
        let requestPort = '';
        const portValue = (request as { port?: string | number }).port;
        if (portValue) {
          requestPort = `:${portValue}`;
        }
        const fullUrl = `${request.protocol}://${request.hostname}${requestPort}${request.url}`;
        const fullUrlObject = new URL(fullUrl);
        const fullUrlPathname = fullUrlObject.pathname;

        // Enforce trailing slash
        if (fullUrlPathname.slice(-1) !== '/') {
          reply.redirect(`${fullUrlPathname}/`);
          return reply;
        }

        // Read SPARQL endpoint URL from configuration and resolve with full URL
        const endpointUrl = new URL(endpoint, fullUrl);

        const catalogueEndpoints = JSON.stringify([
          ...catalogOption,
          endpointUrl,
        ]);

        const content = await render(
          request,
          view,
          {
            endpointUrl: endpointUrl.toString(),
            catalogueEndpoints,
            urlShortener,
            mapKind: mapKindOption,
            defaultQuery: JSON.stringify(defaultQueryOption),
          },
          { title: 'YASGUI' },
        );

        reply.type('text/html').send(content);
        return reply;
      };
      return handler;
    },
  };
};

export default trifidFactory;
