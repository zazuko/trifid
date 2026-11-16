import { fileURLToPath } from 'node:url';
import fastifyStatic from '@fastify/static';
import { joinSubpath } from 'trifid-core';
import type { TrifidPlugin } from 'trifid-core';

// JSON is embedded in an HTML script element: escape HTML delimiters, including
// those in user-supplied query literals, before bypassing Handlebars escaping.
const scriptJson = (value: unknown) =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

const factory: TrifidPlugin = async ({ config, render, server, subpath }) => {
  const {
    endpointUrl,
    catalog = [],
    defaultQuery = 'SELECT * WHERE { ?s ?p ?o } LIMIT 10',
    template,
    urlShortener,
    mapKind = 'default',
  } = config;
  if (!Array.isArray(catalog) || catalog.some((value) => typeof value !== 'string')) {
    throw new Error('"catalog" option must be an array of endpoint URLs');
  }
  if (!['default', 'swisstopo'].includes(String(mapKind))) throw new Error('Unsupported map kind');
  const endpoint =
    typeof endpointUrl === 'string' && endpointUrl ? endpointUrl : joinSubpath(subpath, '/query');
  const view =
    typeof template === 'string' && template
      ? template
      : fileURLToPath(new URL('views/ldforge.hbs', import.meta.url));
  server.register(fastifyStatic, {
    root: fileURLToPath(new URL('build/', import.meta.url)),
    prefix: joinSubpath(subpath, '/ldforge-assets/'),
    decorateReply: false,
  });
  return {
    defaultConfiguration: async () => ({ methods: ['GET'], paths: ['/sparql', '/sparql/'] }),
    routeHandler: async () => async (request, reply) => {
      const pathname = new URL(request.url, 'http://localhost').pathname;
      if (!pathname.endsWith('/')) {
        const search = new URL(request.url, 'http://localhost').search;
        return reply.redirect(`${pathname}/${search}`);
      }
      const content = await render(
        request,
        view,
        {
          editorConfig: scriptJson({ endpoint, catalog, defaultQuery, urlShortener, mapKind }),
        },
        { title: 'LDForge' },
      );
      return reply.type('text/html').send(content);
    },
  };
};
export default factory;
