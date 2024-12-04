export const defaultConfiguration = {
  resourceNoSlash: true,
  resourceExistsQuery: 'ASK { <{{iri}}> ?p ?o }',
  resourceGraphQuery: 'DESCRIBE <{{iri}}>',
  containerExistsQuery: 'ASK { ?s a ?o. FILTER REGEX(STR(?s), "^{{iri}}") }',
  containerGraphQuery:
    'CONSTRUCT { ?s a ?o. } WHERE { ?s a ?o. FILTER REGEX(STR(?s), "^{{iri}}") }',
  redirectQuery: `
    PREFIX http2011: <http://www.w3.org/2011/http#>
    PREFIX http2006: <http://www.w3.org/2006/http#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

    SELECT ?req ?res ?location ?responseCode ?validFrom
    WHERE {
      GRAPH ?g {

        # Handle 2011 version
        {
          ?req2011 rdf:type http2011:GetRequest.
          ?req2011 http2011:requestURI <{{iri}}>.
          ?req2011 http2011:response ?res2011.

          ?res2011 rdf:type http2011:Response.
          ?res2011 http2011:location ?location2011.
          ?res2011 http2011:responseCode ?responseCode2011.

          OPTIONAL {
            ?res2011 <http://schema.org/validFrom> ?validFrom2011.
          }
        }

        UNION

        # Handle 2006 version
        {
          ?req2006 rdf:type http2006:GetRequest.
          ?req2006 http2006:requestURI <{{iri}}>.
          ?req2006 http2006:response ?res2006.

          ?res2006 rdf:type http2006:Response.
          ?res2006 http2006:location ?location2006.
          ?res2006 http2006:responseCode ?responseCode2006.

          OPTIONAL {
            ?res2006 <http://schema.org/validFrom> ?validFrom2006.
          }
        }

        # Combine results, using priority for 2011 version over 2006 version
        BIND(COALESCE(?req2011, ?req2006) AS ?req)
        BIND(COALESCE(?res2011, ?res2006) AS ?res)
        BIND(COALESCE(?location2011, ?location2006) AS ?location)
        BIND(COALESCE(?validFrom2011, ?validFrom2006) AS ?validFrom)
        # Just get the response code as a string instead of the full IRI
        BIND(STRAFTER(STR(COALESCE(?responseCode2011, ?responseCode2006)), "#") AS ?responseCode)
      }
    }
    LIMIT 1
  `,
  followRedirects: false,
  enableSchemaUrlRedirect: false, // Experimental
  allowEndpointSwitch: false, // Experimental
}
