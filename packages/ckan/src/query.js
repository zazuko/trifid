// @ts-check

import { sparql } from '@tpluscode/rdf-string'
import rdf from '@zazuko/env'

/**
 * Query to retrieve all datasets for a given organization.
 *
 * @param {import('@rdfjs/types').NamedNode<string>} organizationId The organization identifier.
 * @returns {import('@tpluscode/rdf-string').SparqlTemplateResult}
 */
const datasetsQuery = (organizationId) => {
  return sparql`
    CONSTRUCT {
      ?dataset ?p ?o .
      ?o ?nestedP ?nestedO .
      ?copyright ${rdf.ns.schema.identifier} ?copyrightIdentifier .
      ?dataset ${rdf.ns.dcterms.accrualPeriodicity} ?accrualPeriodicity .
      ?publisher ${rdf.ns.schema.name} ?publisherName .
      ?dataset ${rdf.ns.dcat.theme} ?euTheme .
    }
    WHERE {
      ?dataset ?p ?o .

      ?dataset ${rdf.ns.dcterms.creator} ${organizationId} .
      ?dataset ${rdf.ns.schema.workExample} <https://ld.admin.ch/application/opendataswiss> .
      ?dataset ${rdf.ns.schema.creativeWorkStatus} <https://ld.admin.ch/vocabulary/CreativeWorkStatus/Published> .

      FILTER ( NOT EXISTS { ?dataset ${rdf.ns.schema.validThrough} ?expiration1 . } )
      FILTER ( NOT EXISTS { ?dataset ${rdf.ns.schema.expires} ?expiration2 . } )

      OPTIONAL {
        ?o ?nestedP ?nestedO .
        FILTER( ?nestedP != <https://cube.link/observation> )
      }

      OPTIONAL {
        ?dataset ${rdf.ns.dcterms.rights} ?copyright .
        GRAPH ?copyrightGraph {
          ?copyright ${rdf.ns.schema.identifier} ?copyrightIdentifier .
        }
      }

      OPTIONAL {
        ?dataset ${rdf.ns.dcterms.accrualPeriodicity} ?accrualPeriodicity .
      }

      OPTIONAL {
        ?dataset ${rdf.ns.dcterms.publisher} ?publisher .
        ?publisher ${rdf.ns.schema.name} ?publisherName .
      }

      OPTIONAL {
        ?dataset ${rdf.ns.dcat.theme} ?theme .
        ?theme ${rdf.ns.schema.supersededBy}?/${rdf.ns.schema.sameAs} ?euTheme .
      }

      FILTER (?p != ${rdf.ns.dcat.theme})
    }
  `
}

export { datasetsQuery }
