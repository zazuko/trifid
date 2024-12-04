import mimeparse from 'mimeparse'
import { sparqlSupportedTypes } from 'trifid-core'

/**
 * Get the accept header from the request
 *
 * @param {{query?: Record<string, any>, headers?: Record<string, any>}} req - The request object
 * @returns {string} The accept header
 */
export const getAcceptHeader = (req) => {
  const queryStringValue = req.query.format

  const supportedQueryStringValues = {
    ttl: 'text/turtle',
    jsonld: 'application/ld+json',
    xml: 'application/rdf+xml',
    nt: 'application/n-triples',
    trig: 'application/trig',
    csv: 'text/csv',
    html: 'text/html',
  }

  if (
    Object.hasOwnProperty.call(supportedQueryStringValues, queryStringValue)
  ) {
    return supportedQueryStringValues[queryStringValue]
  }

  const acceptHeader = `${req.headers?.accept || 'text/html'}`.toLocaleLowerCase()
  const selectedHeader = mimeparse.bestMatch([
    ...sparqlSupportedTypes,
    'text/html',
  ], acceptHeader)

  return selectedHeader || acceptHeader
}
