// @ts-check

import ParsingClient from 'sparql-http-client/ParsingClient.js'
import { toXML } from './xml.js'
import { datasetsQuery } from './query.js'

export const createAPI = (config) => {
  const client = new ParsingClient({
    endpointUrl: config.endpointUrl,
    user: config.user,
    password: config.password,
  })

  const fetchDatasets = async (organizationId) => {
    const query = datasetsQuery(organizationId, config.queryAllGraphs)
    return await client.query.construct(query.toString())
  }

  return {
    fetchDatasets,
    toXML,
  }
}
