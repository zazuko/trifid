import ParsingClient from 'sparql-http-client/ParsingClient.js';

import type { DatasetCore, NamedNode, Quad } from '@rdfjs/types';

import { toXML } from './xml.ts';
import { datasetsQuery } from './query.ts';

/**
 * API Configuration.
 */
interface APIConfig {
  /** The SPARQL endpoint URL. */
  endpointUrl: string;
  /** The user for the endpoint. */
  user?: string;
  /** The password for the endpoint. */
  password?: string;
}

/**
 * Create CKAN API.
 *
 * @param config API configuration.
 */
export const createAPI = (config: APIConfig): {
  fetchDatasets: (organizationId: NamedNode) => Promise<DatasetCore<Quad, Quad>>;
  toXML: (dataset: DatasetCore<Quad, Quad>) => string;
} => {
  const client = new ParsingClient({
    endpointUrl: config.endpointUrl,
    user: config.user,
    password: config.password,
  });

  const fetchDatasets = async (organizationId: NamedNode): Promise<DatasetCore<Quad, Quad>> => {
    const query = datasetsQuery(organizationId);
    return await client.query.construct(query.toString()) as unknown as DatasetCore<Quad, Quad>;
  };

  return {
    fetchDatasets,
    toXML,
  };
};
