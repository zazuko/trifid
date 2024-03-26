// @ts-check

import ParsingClient from 'sparql-http-client/ParsingClient.js'
import { toXML } from './xml.js'
import { datasetsQuery } from './query.js'

/**
 * API Configuration.
 *
 * @typedef {Object} APIConfig
 * @property {string} endpointUrl The SPARQL endpoint URL.
 * @property {string} user The user for the endpoint.
 * @property {string} password The password for the endpoint.
 */

/**
 * Fetch datasets.
 *
 * @typedef {(organizationId: import('@rdfjs/types').NamedNode<string>) => Promise<import('@rdfjs/types').DatasetCore<import('@rdfjs/types').Quad, import('@rdfjs/types').Quad>>} FetchDatasets
 */

/**
 * Create CKAN API.
 *
 * @param {APIConfig} config API configuration.
 * @returns {{ fetchDatasets: FetchDatasets, toXML: (dataset: import('@rdfjs/types').DatasetCore<import('@rdfjs/types').Quad, import('@rdfjs/types').Quad>) => string}}
 */
export const createAPI = (config) => {
  const client = new ParsingClient({
    endpointUrl: config.endpointUrl,
    user: config.user,
    password: config.password,
  })

  /**
   * @type {FetchDatasets}
   */
  const fetchDatasets = async (organizationId) => {
    const query = datasetsQuery(organizationId)
    return await client.query.construct(query.toString())
  }

  return {
    fetchDatasets,
    toXML,
  }
}
