import rdf from '@zazuko/env';

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { TrifidPlugin } from 'trifid-core';

import { createAPI } from './ckan.ts';

const factory: TrifidPlugin = async (trifid) => {
  const { config, logger } = trifid;

  const { endpointUrl, user, password } = config;
  const configuredEndpoint = typeof endpointUrl === 'string' && endpointUrl ? endpointUrl : '/query';

  return {
    defaultConfiguration: async () => {
      return {
        methods: ['GET'],
        paths: ['/ckan'],
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
        const endpoint = new URL(configuredEndpoint, fullUrl);
        const { fetchDatasets, toXML } = createAPI({
          endpointUrl: endpoint.toString(),
          user: typeof user === 'string' ? user : undefined,
          password: typeof password === 'string' ? password : undefined,
        });

        const organization = (request.query as { organization?: string })?.organization;
        if (!organization) {
          reply.status(400).send('Missing `organization` query param');
          return reply;
        }

        logger.debug(`Asked for the '${organization}' organization`);

        try {
          const uri = rdf.namedNode(organization);

          const dataset = await fetchDatasets(uri);
          const xml = toXML(dataset);

          const format = 'application/rdf+xml';

          reply.type(format).send(xml.toString());
        } catch (e) {
          logger.error(e);
          reply.status(500).send('Error');
        }

        return reply;
      };
      return handler;
    },
  };
};

export default factory;
