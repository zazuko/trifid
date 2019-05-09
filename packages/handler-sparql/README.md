# trifid-handler-sparql

SPARQL handler for [Trifid](https://github.com/zazuko/trifid).
Fetches the graphs for a given IRI from a SPARQL endpoint.

# Usage

The handler treats IRI that end with a slash as `containers`.
Other IRIs are treated as `resources`.
Before the actual triples are fetched an exists `ASK` query is issued.
The `${iri}` variable in the queries will be replaced with the requested IRI.
The following options are supported:
 
- `endpointUrl`: The URL to the SPARQL endpoint
- `resourceExistsQuery`: The `ASK` query to check whether the resources exists or not
- `resourceGraphQuery`: The query to fetch the actual triples of the resource
- `containerExistsQuery`: The `ASK` query to check whether the container exists or not
- `containerGraphQuery`: The query to fetch the actual triples of the container
- `resourceNoSlash`: The handler will also check if there is a resource with a URL ending
  with a slash before running the container logic.
  Set this option to true to disable the resource exists query.
  Useful if you know there are no triples with container URLs.

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

## Debug

This package uses [`debug`](https://www.npmjs.com/package/debug), you can get debug logging via: `DEBUG=trifid:handler-sparql`.
