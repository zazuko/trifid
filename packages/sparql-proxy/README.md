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
      # headers: # Optional headers to be sent with each request
      #   X-Custom-Header: "CustomValue"

      # # In case you want to add support for multiple endpoints
      # # Define the endpoints in the following way (the "default" endpoint is required)
      # # The default endpoint value will override the endpointUrl, username, password and headers values
      # endpoints:
      #   default:
      #     endpointUrl: https://example.com/query
      #     username: admin1
      #     password: secret1
      #     headers:
      #       X-Custom-Header: "CustomValueDefault"
      #   other:
      #     endpointUrl: https://example.com/other-query
      #     username: admin2
      #     password: secret2
      #     headers:
      #       X-Custom-Header: "CustomValueOther"

      # Rewriting configuration
      datasetBaseUrl: http://example.org/ # The domain used by the IRIs in the data
      allowRewriteToggle: true # Allow the user to toggle the rewrite configuration using the `rewrite` query parameter, even if `rewrite` is set to false
      rewrite: true # Rewrite by default
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

## Rewriting the domain of the data

The IRIs in a dataset usually use a different domain than the one the instance is served from.
For example the data can use `http://example.org/path/resource` while the instance is served from `https://example.com`.

Set `datasetBaseUrl` to the domain used by the data and enable `rewrite` to translate between the two:

```yaml
plugins:
  sparql-proxy:
    module: "@zazuko/trifid-plugin-sparql-proxy"
    paths: /query
    config:
      endpointUrl: https://example.com/query
      datasetBaseUrl: http://example.org/
      rewrite: true
```

With that configuration:

- `rewriteQuery` translates the IRIs of the **incoming query** from the domain of the instance to the domain of the data, so that a query for `https://example.com/path/resource` reaches the endpoint as `http://example.org/path/resource`
- `rewriteResults` translates the IRIs of the **query results** back to the domain of the instance, so that clients receive `https://example.com/path/resource`

Both are enabled by default and can be disabled individually.

`datasetBaseUrl` is often defined once in the `globals` section of the configuration, in which case every plugin — including this one — picks it up automatically:

```yaml
globals:
  datasetBaseUrl: http://example.org/
```

### Letting clients opt out

With `allowRewriteToggle` enabled (the default), a client can override the configured behaviour per request using the `rewrite` query parameter, for example `?rewrite=false` to get the raw IRIs of the data.

### Rewriting and subpaths

When the instance is served under a [subpath](https://github.com/zazuko/trifid#serving-under-a-subpath) using `server.subpath`, the rewriting takes it into account automatically.

With `server.subpath: /SUBPATH` and `datasetBaseUrl: http://example.org/`, the results are rewritten to `https://example.com/SUBPATH/path/resource`, so the IRIs stay dereferenceable.
No additional configuration is required.
