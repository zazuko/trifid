import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolve } from 'import-meta-resolve';
import fastifyStatic from '@fastify/static';

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { ConfigRecord, RenderFunction, TrifidPlugin } from 'trifid-core';

const __dirname = dirname(fileURLToPath(import.meta.url));

const defaults = {
  template: join(__dirname, 'views/index.hbs'),
};

/**
 * User-provided options for the SPEX plugin.
 */
interface SpexUserOptions {
  url: string | null;
  user: string | null;
  password: string | null;
  graph: string | null;
  prefixes: string[];
  forceIntrospection: boolean;
}

const defaultOptions: SpexUserOptions = {
  url: null,
  user: null,
  password: null,
  graph: null,
  prefixes: [],
  forceIntrospection: false,
};

/**
 * Create Plugin.
 *
 * @param server Fastify server instance.
 * @param config Plugin configuration.
 * @param render Trifid render function.
 */
const createPlugin = async (
  server: FastifyInstance,
  config: ConfigRecord,
  render: RenderFunction,
) => {
  const options = { ...defaultOptions, ...(config as Partial<SpexUserOptions>) };
  const spexOptions = {
    sparqlEndpoint: options.url,
    username: options.user,
    password: options.password,
    forceIntrospection: options.forceIntrospection,
    namedGraph: options.graph,
    prefixes: options.prefixes,
  };

  const template = typeof config.template === 'string' ? config.template : defaults.template;

  // Serve static files from SPEX dist folder
  const distPath = dirname(resolve('@zazuko/spex', import.meta.url));
  server.register(fastifyStatic, {
    root: distPath.replace(/^file:\/\//, ''),
    prefix: '/spex/static/',
    decorateReply: false,
  });

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

    // Create an absolute URL if a relative URL is provided
    spexOptions.sparqlEndpoint = new URL(
      spexOptions.sparqlEndpoint || '/query',
      fullUrl,
    ).toString();

    const content = await render(
      request,
      template,
      {
        options: JSON.stringify(spexOptions),
      },
      { title: 'SPEX' },
    );

    reply.type('text/html').send(content);
    return reply;
  };
  return handler;
};

const trifidFactory: TrifidPlugin = async (trifid) => {
  const { server, config, render } = trifid;

  return {
    defaultConfiguration: async () => {
      return {
        methods: ['GET'],
        paths: [
          '/spex',
          '/spex/',
        ],
      };
    },
    routeHandler: async () => createPlugin(server, config, render),
  };
};

export default trifidFactory;
export { createPlugin };
