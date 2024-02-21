// @ts-check

import { sparql } from '@tpluscode/rdf-string'
import * as ns from './namespace.js'

/**
 * Query to retrieve all datasets for a given organization.
 *
 * @param {import('@rdfjs/types').NamedNode<string>} organizationId The organization identifier.
 * @param {boolean} queryAllGraphs Whether to query all graphs or only the default one.
 * @returns {import('@tpluscode/rdf-string').SparqlTemplateResult}
 */
const datasetsQuery = (organizationId, queryAllGraphs) => {
  const startQueryGraph = queryAllGraphs ? 'GRAPH ?graph {' : ''
  const endQueryGraph = queryAllGraphs ? '}' : ''

  return sparql`
    CONSTRUCT {
      ?dataset ?p ?o .
      ?o ?nestedP ?nestedO .
      ?copyright ${ns.schema.identifier} ?copyrightIdentifier .
      ?dataset ${ns.dcterms.accrualPeriodicity} ?accrualPeriodicity .
    }
    WHERE {
      ${startQueryGraph}
        ?dataset ?p ?o .

        ?dataset ${ns.dcterms.creator} ${organizationId} .
        ?dataset ${ns.schema.workExample} <https://ld.admin.ch/application/opendataswiss> .
        ?dataset ${ns.schema.creativeWorkStatus} <https://ld.admin.ch/vocabulary/CreativeWorkStatus/Published> .

        FILTER ( NOT EXISTS { ?dataset ${ns.schema.validThrough} ?expiration1 . } )
        FILTER ( NOT EXISTS { ?dataset ${ns.schema.expires} ?expiration2 . } )

        OPTIONAL {
          ?o ?nestedP ?nestedO .
          FILTER( ?nestedP != <https://cube.link/observation> )
        }

        OPTIONAL {
          ?dataset ${ns.dcterms.rights} ?copyright .
          GRAPH ?copyrightGraph {
            ?copyright ${ns.schema.identifier} ?copyrightIdentifier .
          }
        }

        OPTIONAL {
          ?dataset ${ns.dcterms.accrualPeriodicity} ?accrualPeriodicity .
        }
      ${endQueryGraph}
    }
  `
}

export { datasetsQuery }
