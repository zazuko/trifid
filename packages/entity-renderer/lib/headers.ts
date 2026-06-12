import mimeparse from 'mimeparse';
import { sparqlSupportedTypes } from 'trifid-core';

/**
 * Get the accept header from the request
 *
 * @param req - The request object
 * @returns The accept header
 */
export const getAcceptHeader = (
  req: { query?: Record<string, unknown>; headers?: Record<string, unknown> },
): string => {
  const queryStringValue = `${req.query?.format ?? ''}`;

  const supportedQueryStringValues: Record<string, string> = {
    ttl: 'text/turtle',
    jsonld: 'application/ld+json',
    xml: 'application/rdf+xml',
    nt: 'application/n-triples',
    trig: 'application/trig',
    csv: 'text/csv',
    html: 'text/html',
  };

  const mapped = supportedQueryStringValues[queryStringValue];
  if (mapped) {
    return mapped;
  }

  const acceptHeader = `${req.headers?.accept || 'text/html'}`.toLocaleLowerCase();
  const selectedHeader = mimeparse.bestMatch([
    ...sparqlSupportedTypes,
    'text/html',
  ], acceptHeader);

  return selectedHeader || acceptHeader;
};
