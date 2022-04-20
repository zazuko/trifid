import { toXML } from './xml.js'

import { datasetsQuery } from './query.js'
import ParsingClient from 'sparql-http-client/ParsingClient.js'

export function createAPI (config) {
  const client = new ParsingClient({
    endpointUrl: config.endpointUrl,
    user: config.user,
    password: config.password
  })

  async function fetchDatasets (organizationId) {
    const query = datasetsQuery(organizationId)
    return await client.query.construct(query.toString())
  }

  return {
    fetchDatasets,
    toXML
  }
}
