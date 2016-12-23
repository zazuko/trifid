# trifid-handler-sparql

SPARQL handler for Trifid.
Fetches the graphs for a given IRI from a SPARQL endpoint.

# Usage

The handler treats IRI which end with a slash as `containers`.
Other IRIs are treated as `resources`.
Before the actual triples are fetched an exists `ASK` query is called.
The `${iri}` variable in the queries will be replaced with the requested IRI.
The following options are supported:
 
- `endpointUrl`: The URL to the SPARQL endpoint
- `resourceExistsQuery`: The `ASK` query to check whether the resources exists or not
- `resourceGraphQuery`: The query to fetch the actual triples of the resource
- `containerExistsQuery`: The `ASK` query to check whether the container exists or not
- `containerGraphQuery`: The query to fetch the actual triples of the container

## Examples

This configuration tells Trifid to use the `trifid-handler-sparql` handler and the DBpedia SPARQL endpoint.
It also defines the queries to fetch the resources and containers: 

```
"handler": {
  "module": "trifid-handler-sparql",
  "options": {
    "endpointUrl": "https://dbpedia.org/sparql",
    "resourceExistsQuery": "ASK { <${iri}> ?p ?o }",
    "resourceGraphQuery": "DESCRIBE <${iri}>",
    "containerExistsQuery": "ASK { ?s a ?o. FILTER REGEX(STR(?s), \"^${iri}\") }",
    "containerGraphQuery": "CONSTRUCT { ?s a ?o. } WHERE { ?s a ?o. FILTER REGEX(STR(?s), \"^${iri}\") }"
  }
}
```
