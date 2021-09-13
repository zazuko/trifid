import { sparql } from '@tpluscode/rdf-string'
import ParsingClient from 'sparql-http-client/ParsingClient.js'
import * as ns from './namespace.js'

const prepareClient = () => {
  const env = process.env
  const clientConfig = {
    endpointUrl: env.STORE_QUERY_ENDPOINT,
    user: env.STORE_ENDPOINT_USERNAME,
    password: env.STORE_ENDPOINT_PASSWORD,
  }
  return new ParsingClient(clientConfig)
}

export function fetchDatasets(graph) {
  const query = sparql`
    CONSTRUCT {
      ?s ?p ?o .
    }
    WHERE {
      GRAPH ${graph} {
        ?s ?p ?o .
        ?s ${ns.schema.workExample} <https://ld.admin.ch/application/opendataswiss> .
        ?s ${ns.schema.creativeWorkStatus} <https://ld.admin.ch/definedTerm/CreativeWorkStatus/Published> .

        FILTER ( NOT EXISTS { ?s ${ns.schema.validThrough} ?expiration1 . } )
        FILTER ( NOT EXISTS { ?s ${ns.schema.expires} ?expiration2 . } )
      }
    }
  `
  const client = prepareClient()

  return client.query.construct(query)
}
