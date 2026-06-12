import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolve } from 'import-meta-resolve';
import fastifyStatic from '@fastify/static';

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { TrifidPlugin } from 'trifid-core';

const currentDir = dirname(fileURLToPath(import.meta.url));

const factory: TrifidPlugin = async (trifid) => {
  const { config, server, render } = trifid;
  const {
    template,
    endpointUrl,
    acceptBlankNodes: acceptBlankNodesConfig,
    dataLabelProperty: dataLabelPropertyConfig,
    schemaLabelProperty: schemaLabelPropertyConfig,
    language: languageConfig,
    languages: languagesConfig,
    title: titleConfig,
  } = config;

  const view = typeof template === 'string' && template ? template : `${currentDir}/views/graph-explorer.hbs`;

  // Serve static files for graph-explorer
  const distPath = resolve('graph-explorer/dist/', import.meta.url);
  server.register(fastifyStatic, {
    root: distPath.replace(/^file:\/\//, ''),
    prefix: '/graph-explorer/assets/',
    decorateReply: false,
  });
  server.register(fastifyStatic, {
    root: `${currentDir}/static/`,
    prefix: '/graph-explorer/static/',
    decorateReply: false,
  });

  const endpoint = typeof endpointUrl === 'string' && endpointUrl ? endpointUrl : '/query';
  const acceptBlankNodes = !!acceptBlankNodesConfig;
  const dataLabelProperty = dataLabelPropertyConfig || 'rdfs:label';
  const schemaLabelProperty = schemaLabelPropertyConfig || 'rdfs:label';
  const language = languageConfig || 'en';
  const languages = languagesConfig || [
    { code: 'en', label: 'English' },
    { code: 'de', label: 'German' },
    { code: 'fr', label: 'French' },
    { code: 'it', label: 'Italian' },
  ];
  const title = titleConfig || 'Graph Explorer';

  return {
    defaultConfiguration: async () => {
      return {
        methods: ['GET'],
        paths: [
          '/graph-explorer',
          '/graph-explorer/',
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

        const content = await render(
          request,
          view,
          {
            // Just forward all the config as a string
            graphExplorerConfig: JSON.stringify({
              // Read SPARQL endpoint URL from configuration and resolve with the current full URL
              endpointUrl: new URL(endpoint, fullUrl).href,

              // All other configured options
              acceptBlankNodes,
              dataLabelProperty,
              schemaLabelProperty,
              language,
              languages,
            }).replace(/'/g, '\\\''),
          },
          { title },
        );

        reply.type('text/html').send(content);
        return reply;
      };
      return handler;
    },
  };
};

export default factory;
