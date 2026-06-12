import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { metrics } from '@opentelemetry/api';
import { parsers } from '@rdfjs/formats-common';
import rdf from '@zazuko/env';
import { sparqlSerializeQuadStream, sparqlSupportedTypes, sparqlGetRewriteConfiguration } from 'trifid-core';

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { TrifidPlugin } from 'trifid-core';

import { defaultConfiguration } from './lib/config.ts';
import { getAcceptHeader } from './lib/headers.ts';
import { checkDatasetBaseUrl } from './lib/base.ts';

import { createEntityRenderer } from './renderer/entity.ts';
import { createMetadataProvider } from './renderer/metadata.ts';

const meter = metrics.getMeter('entity-renderer');
const dereferencedCounter = meter.createCounter('sparql_entities_dereferenced_total', {
  description: 'Number of entities dereferenced in total',
});
const redirectedCounter = meter.createCounter('sparql_entities_redirected_total', {
  description: 'Number of entities redirected in total',
});

const currentDir = dirname(fileURLToPath(import.meta.url));

const DEFAULT_ENDPOINT_NAME = 'default';

const replaceIriInQuery = (query: string, iri: string) => {
  return query.split('{{iri}}').join(iri);
};

const fixContentTypeHeader = (contentType: string) => {
  return (contentType.split(';')[0] ?? '').trim().toLocaleLowerCase();
};

const factory: TrifidPlugin = async (trifid) => {
  const { render, logger, query } = trifid;
  // The entity-renderer configuration is highly dynamic; values are narrowed
  // where it matters and otherwise treated as opaque.
  const config = trifid.config as Record<string, any>;
  const mergedConfig: Record<string, any> = { ...defaultConfiguration, ...config };
  const entityRenderer = createEntityRenderer({ options: config, logger, query });
  const metadataProvider = createMetadataProvider({ options: config });

  const { path, ignorePaths, rewrite: rewriteConfigValue, datasetBaseUrl: datasetBaseUrlValue, allowEndpointSwitch: allowEndpointSwitchConfigValue } = config;
  const allowEndpointSwitch = `${allowEndpointSwitchConfigValue}` === 'true';
  const entityTemplatePath = path || `${currentDir}/views/render.hbs`;
  const datasetBaseUrls = checkDatasetBaseUrl(logger, datasetBaseUrlValue);

  // Map of dataset base URLs with their rewrite configuration.
  const dbu = new Map<string, {
    rewrite: boolean;
    replaceIri: (iri: string) => string;
    iriOrigin: (iri: string) => string;
    datasetBaseUrl: string;
  }>();
  if (datasetBaseUrls.length === 0) {
    dbu.set('default', { rewrite: rewriteConfigValue, replaceIri: (iri) => iri, iriOrigin: (iri) => iri, datasetBaseUrl: '' });
    logger.debug('No datasetBaseUrl provided, no rewriting will be done');
  }
  datasetBaseUrls.forEach((value) => {
    const rewriteConfig = sparqlGetRewriteConfiguration(rewriteConfigValue, value);
    // Just to have all the fields explicitly defined
    const { rewrite: rewriteValue, replaceIri, iriOrigin, datasetBaseUrl } = rewriteConfig;
    dbu.set(value, { rewrite: rewriteValue, replaceIri, iriOrigin, datasetBaseUrl: datasetBaseUrl ?? '' });

    logger.debug(`Rewriting is ${rewriteValue ? 'enabled' : 'disabled'} for '${value}' dataset base URL`);
  });

  const additionalRewritesConfig = config.additionalRewrites || [];
  if (!Array.isArray(additionalRewritesConfig)) {
    throw new Error('The `additionalRewrites` configuration must be an array');
  }
  const additionalRewrites = additionalRewritesConfig.map((value: any) => {
    if (typeof value === 'string') {
      return { find: value };
    }
    if (!value || !value.find) {
      throw new Error('Each additional rewrite must have a `find` value');
    }
    return value;
  });

  // If `ignorePaths` is not provided or invalid, we configure some defaults values
  let ignoredPaths = ignorePaths;
  if (!ignorePaths || !Array.isArray(ignorePaths)) {
    ignoredPaths = ['/query'];
  }

  return {
    defaultConfiguration: async () => {
      return {
        methods: ['GET'],
        paths: ['/*'],
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
        const q = request.query as Record<string, any>;
        const currentPath = request.url.split('?')[0];
        // Check if it is a path that needs to be ignored (check of type is already done at the load of the plugin)
        if (ignoredPaths.includes(currentPath)) {
          reply.callNotFound();
          return reply;
        }

        // Get the endpoint name from the query parameter or from the cookie (if allowed)
        const savedEndpointName = request.cookies.endpointName || DEFAULT_ENDPOINT_NAME;
        let endpointName = q.endpoint || savedEndpointName;
        endpointName = endpointName.replace(/[^a-z0-9-]/gi, '');

        const i18nValue = `${request.session.get('currentLanguage') || 'en'}`.replace(/[^a-z0-9-]/gi, '');

        // To avoid any languge issues, we will forward the i18n cookie to the SPARQL endpoint + add the endpointName cookie
        const queryHeaders = {
          cookie: `i18n=${i18nValue}${allowEndpointSwitch && endpointName !== DEFAULT_ENDPOINT_NAME ? `; endpointName=${endpointName}` : ''}`,
        };

        // Get the expected format from the Accept header or from the `format` query parameter
        const acceptHeader = getAcceptHeader(request as { query?: Record<string, unknown>; headers?: Record<string, unknown> });

        // Generate the IRI we expect
        let requestPort = '';
        const portValue = (request as { port?: string | number }).port;
        if (portValue) {
          requestPort = `:${portValue}`;
        }
        const fullUrl = `${request.protocol}://${request.hostname}${requestPort}${request.url}`;
        const iriUrl = new URL(fullUrl);
        iriUrl.search = '';
        iriUrl.searchParams.forEach((_value, key) => iriUrl.searchParams.delete(key));
        const iriUrlString = iriUrl.toString();

        let iri: string | undefined;
        let iriOrigin: ((iri: string) => string) | undefined;
        let replaceIri: ((iri: string) => string) | undefined;
        let rewriteValue: boolean | undefined;
        let datasetBaseUrl: string | undefined;
        let isContainer: boolean | undefined;
        for (const [_key, value] of dbu) {
          if (iri !== undefined) {
            break;
          }

          const tmpIri = value.replaceIri(iriUrlString);
          const tmpIsContainer = mergedConfig.resourceNoSlash && tmpIri.endsWith('/');
          logger.debug(`IRI value: ${tmpIri}${value.rewrite ? ' (rewritten)' : ''} - is container: ${tmpIsContainer ? 'true' : 'false'}`);

          // Check if the IRI exists in the dataset ; if so, use it for the rest of the process
          const askQuery = tmpIsContainer ? mergedConfig.containerExistsQuery : mergedConfig.resourceExistsQuery;
          const exists = await query(replaceIriInQuery(askQuery, tmpIri), { ask: true, headers: queryHeaders });
          if (exists) {
            iriOrigin = value.iriOrigin;
            replaceIri = value.replaceIri;
            rewriteValue = value.rewrite;
            datasetBaseUrl = value.datasetBaseUrl;
            isContainer = tmpIsContainer;
            iri = tmpIri;
            logger.debug(`IRI found: ${iri}`);
            break;
          }
        }

        const rewriteResponse = rewriteValue
          ? [
              ...additionalRewrites.map(({ find, replace }: any) => {
                if (!replace) {
                  return { find, replace: iriOrigin!(iriUrlString) };
                } else {
                  return { find, replace };
                }
              }),
              { find: datasetBaseUrl, replace: iriOrigin!(iriUrlString) },
            ]
          : [];

        // If the IRI is not found, we return a 404
        if (!iri) {
          reply.callNotFound();
          return reply;
        }

        try {
          // Check if there is a redirect for the IRI
          if (mergedConfig.followRedirects) {
            const redirect = await query(replaceIriInQuery(mergedConfig.redirectQuery, iri), {
              ask: false,
              select: true, // Force the parsing of the response
              rewriteResponse,
              headers: queryHeaders,
            }) as any[];
            if (redirect.length > 0) {
              const entityRedirect = redirect[0];
              const { responseCode, location } = entityRedirect;
              if (responseCode && location && responseCode.value && location.value) {
                logger.debug(`Redirecting <${iri}> to <${location.value}> (HTTP ${responseCode.value})`);
                redirectedCounter.add(1, { response_code: responseCode.value, endpoint_name: endpointName, kind: 'sparql' });
                reply.status(parseInt(responseCode.value, 10)).redirect(location.value);
                return reply;
              } else {
                logger.warn('Redirect query did not return the expected results');
              }
            }
          }

          // Get the entity from the dataset
          const describeQuery = isContainer ? mergedConfig.containerGraphQuery : mergedConfig.resourceGraphQuery;
          const describeQueryAcceptHeader = isContainer ? mergedConfig.containerGraphQueryAcceptHeader : mergedConfig.resourceGraphQueryAcceptHeader;
          const entity = await query(replaceIriInQuery(describeQuery, iri), {
            ask: false,
            rewriteResponse,
            headers: {
              ...queryHeaders,
              accept: describeQueryAcceptHeader || 'application/n-quads',
            },
          }) as any;
          const entityContentType = entity.contentType || 'application/n-triples';
          const entityStream = entity.response;
          if (!entityStream) {
            reply.callNotFound();
            return reply;
          }

          // Make sure the Content-Type is lower case and without parameters (e.g. charset)
          const fixedContentType = fixContentTypeHeader(entityContentType);
          const quadStream = parsers.import(fixedContentType, entityStream);

          if (sparqlSupportedTypes.includes(acceptHeader)) {
            dereferencedCounter.add(1, { format: acceptHeader, endpoint_name: endpointName });
            const serialized = await sparqlSerializeQuadStream(quadStream as never, acceptHeader);
            reply.type(acceptHeader).send(serialized);
            return reply;
          }

          const dataset = await rdf.dataset().import(quadStream as never);
          if (mergedConfig.enableSchemaUrlRedirect && acceptHeader === 'text/html') {
            const disabledSchemaUrlRedirect
              = request.headers['x-disable-schema-url-redirect'] === 'true'
                || q.disableSchemaUrlRedirect === 'true';

            // Get all triples that have a schema:URL property with value of type xsd:anyURI
            const urls: string[] = []
            ;(dataset.match(rdf.namedNode(iriUrlString), rdf.ns.schema.URL) as any)
              .filter(({ object }: any) => ['xsd:anyURI', rdf.ns.xsd.anyURI.value].includes(object?.datatype?.value))
              .map(({ object }: any) => urls.push(object.value));
            if (!disabledSchemaUrlRedirect && urls.length > 0) {
              const redirectUrl = urls[0] as string;
              logger.debug(`Redirecting to ${redirectUrl}`);
              redirectedCounter.add(1, { response_code: 302, endpoint_name: endpointName, kind: 'schema_url' });
              reply.redirect(redirectUrl);
              return reply;
            }
          }

          const { entityHtml, entityLabel, entityUrl } = await entityRenderer(
            request,
            {
              dataset,
              rewriteResponse,
              replaceIri,
              headers: queryHeaders,
              entityRoot: rewriteValue ? iri.replace(datasetBaseUrl ?? '', iriOrigin!(iriUrlString)) : iri,
            },
          );
          const metadata = await metadataProvider(request, { dataset });
          const jsonldSerialized = await sparqlSerializeQuadStream(dataset.toStream() as never, 'application/ld+json');

          dereferencedCounter.add(1, { format: 'text/html', endpoint_name: endpointName });
          reply.type('text/html').send(await render(request, entityTemplatePath, {
            dataset: entityHtml,
            entityLabel,
            entityUrl,
            metadata,
            jsonld: jsonldSerialized,
            config,
          }));
        } catch (e) {
          logger.error(e);
          reply.callNotFound();
          return reply;
        }

        return reply;
      };
      return handler;
    },
  };
};

export default factory;
