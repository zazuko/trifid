import jsonld from 'jsonld';
import rdf from '@zazuko/env';
import SparqlHttpClient from 'sparql-http-client';

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { TrifidPlugin } from 'trifid-core';

import frame from './src/frame.ts';
import { createApi } from './src/iiif.ts';

const trifidFactory: TrifidPlugin = async (trifid) => {
  const { config, logger } = trifid;

  if (!config || !config.endpointUrl) {
    throw Error('missing endpointUrl parameter');
  }
  const client = new SparqlHttpClient({
    endpointUrl: config.endpointUrl as string,
    user: config.endpointUser as string | undefined,
    password: config.endpointPassword as string | undefined,
  });

  const api = createApi(client, {
    operation: 'postUrlencoded',
  });
  const uriPrefix = config.uriPrefix ? String(config.uriPrefix) : '';

  return {
    defaultConfiguration: async () => {
      return {
        methods: ['GET'],
        paths: [
          '/iiif/',
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

        const query = request.query as { uri?: string };
        if (!(uriPrefix || query.uri)) {
          logger.debug('No uri query parameter');
          reply.callNotFound();
          return reply;
        }

        const uri = uriPrefix ? rdf.namedNode(`${uriPrefix}${fullUrlPathname}`) : rdf.namedNode(query.uri as string);
        logger.debug(`uri: ${uri.value}`);
        if (!await api.exists(uri)) {
          logger.debug(`uri: ${uri.value} not found`);
          reply.callNotFound();
          return reply;
        }
        logger.debug(`fetching uri: ${uri.value}`);

        const dataset = await api.getBasicDataset(uri);
        const augmented = await api.augmentDataset(dataset);
        const doc = await jsonld.fromRDF(augmented as never, {});
        const framed = await frame(doc);

        reply.send(framed);
        return reply;
      };
      return handler;
    },
  };
};

export default trifidFactory;
