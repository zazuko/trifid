# Trifid plugin for `sparql-proxy`

## Quick start

Install this Trifid plugin using:

```sh
npm install @zazuko/trifid-plugin-sparql-proxy
```

And then add in the `config.yaml` file the following part:

```yaml
plugins:
  # […] your other plugins
  sparql-proxy:
    module: "@zazuko/trifid-plugin-sparql-proxy"
    paths: /query
    config:
      # The endpoint URL is the only required field
      endpointUrl: https://example.com/query

      # In case your endpoint requires authentication:
      username: admin
      password: secret

      # # In case you want to add support for multiple endpoints
      # # Define the endpoints in the following way (the "default" endpoint is required)
      # # The default endpoint value will override the endpointUrl, username and password values
      # endpoints:
      #   default:
      #     endpointUrl: https://example.com/query
      #     username: admin1
      #     password: secret2
      #   other:
      #     endpointUrl: https://example.com/other-query
      #     username: admin2
      #     password: secret2

      # Rewriting configuration
      allowRewriteToggle: true # Allow the user to toggle the rewrite configuration using the `rewrite` query parameter, even if `rewrite` is set to false
      rewrite: false # Rewrite by default
      rewriteQuery: true # Allow rewriting the query (in case of rewriting)
      rewriteResults: true # Allow rewriting the results (in case of rewriting)

      # Configure formats, that can be used as `format` query parameter
      formats:
        ttl: "text/turtle"
        jsonld: "application/ld+json"
        xml: "application/rdf+xml"
        nt: "application/n-triples"
        trig: "application/trig"
        csv: "text/csv"

      # Configure the log level for the queries
      queryLogLevel: debug # Log level for the queries
```
