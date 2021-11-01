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

export function fetchDatasets(organizationId) {
  const query = sparql`
    CONSTRUCT {
      ?dataset ?p ?o .
      ?o ?nestedP ?nestedO .
    }
    WHERE {
      GRAPH ?graph {
        ?dataset ?p ?o .

        ?dataset ${ns.dcterms.creator} ${organizationId} .
        ?dataset ${ns.schema.workExample} <https://ld.admin.ch/application/opendataswiss> .
        ?dataset ${ns.schema.creativeWorkStatus} <https://ld.admin.ch/vocabulary/CreativeWorkStatus/Published> .

        FILTER ( NOT EXISTS { ?dataset ${ns.schema.validThrough} ?expiration1 . } )
        FILTER ( NOT EXISTS { ?dataset ${ns.schema.expires} ?expiration2 . } )

        OPTIONAL {
          ?o ?nestedP ?nestedO .
        }
      }
    }
  `
  const client = prepareClient()

  return client.query.construct(query)
}
