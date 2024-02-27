// @ts-check
import { sparql } from '@tpluscode/rdf-string'
import * as ns from './namespace.js'

/**
 * Query to retrieve all datasets for a given organization.
 *
 * @param {string} organizationId The organization identifier.
 * @returns {import('@tpluscode/rdf-string').SparqlTemplateResult}
 */
const datasetsQuery = (organizationId) => {
  return sparql`
    CONSTRUCT {
      ?dataset ?p ?o .
      ?o ?nestedP ?nestedO .
      ?copyright ${ns.schema.identifier} ?copyrightIdentifier .
      ?dataset ${ns.dcterms.accrualPeriodicity} ?accrualPeriodicity .
      ?publisher ${ns.schema.name} ?publisherName .
      ?dataset ${ns.dcat.theme} ?euTheme .
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

        OPTIONAL {
          ?dataset ${ns.dcterms.publisher} ?publisher .
          ?publisher ${ns.schema.name} ?publisherName .
        }

        OPTIONAL {
          ?dataset ${ns.dcat.theme} ?theme .
          ?theme ${ns.schema.sameAs} ?euTheme .
        }

        FILTER (?p != ${ns.dcat.theme})
      }
    }
  `
}

export { datasetsQuery }
