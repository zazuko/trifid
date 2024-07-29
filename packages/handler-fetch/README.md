# trifid-handler-fetch

This Trifid plugin exposes an endpoint where you can perform SPARQL queries against a dataset which is loaded from a URL.

The URL can be a local file or a remote resource.

At the start of the server, the dataset is loaded from the URL and stored in memory, using [Oxigraph](https://github.com/oxigraph/oxigraph).
The dataset is not updated automatically when the resource changes.

## Usage

Add the `trifid-handler-fetch` package to your dependencies:

```sh
npm install trifid-handler-fetch
```

And update the Trifid configuration to something similar as shown in the example below.

## Example

This example config uses [The Big Bang Theory dataset](https://www.npmjs.com/package/tbbt-ld/):

```yaml
plugins:
  # […]
  handler-fetch:
    module: "trifid-handler-fetch"
    paths: /query
    config:
      url: https://raw.githubusercontent.com/zazuko/tbbt-ld/master/dist/tbbt.nt
      contentType: application/n-triples
      baseIRI: http://example.com
      graphName: http://example.com/graph
```

## Options

- `url`: URL to the resource which contains the dataset
- `contentType`: the format of the serialization. See below for the supported formats.
- `baseIRI`: the base IRI to use to resolve the relative IRIs in the serialization.
- `graphName`: for triple serialization formats, the name of the named graph the triple should be loaded to.
- `unionDefaultGraph`: for triple serialization formats, if the triples should be loaded to the default graph or to the named graph specified in `graphName`. This impacts also the need or not to query a specific graph in SPARQL queries. Defaults to `false`.
- `queryLogLevel`: the log level for the queries. Defaults to `debug`.

Supported formats:

- [Turtle](https://www.w3.org/TR/turtle/): `text/turtle` or `ttl`
- [TriG](https://www.w3.org/TR/trig/): `application/trig` or `trig`
- [N-Triples](https://www.w3.org/TR/n-triples/): `application/n-triples` or `nt`
- [N-Quads](https://www.w3.org/TR/n-quads/): `application/n-quads` or `nq`
- [N3](https://w3c.github.io/N3/spec/): `text/n3` or `n3`
- [RDF/XML](https://www.w3.org/TR/rdf-syntax-grammar/): `application/rdf+xml` or `rdf`
