# Trifid plugin for `sparql-proxy`

## Supported options

Here are all supported options: https://github.com/zazuko/sparql-proxy#usage

## Quick start

Install this Trifid plugin using:

```sh
npm install @zazuko/trifid-plugin-sparql-proxy
```

And then add in the `config.yaml` file the following part:

```yaml
middlewares:
  # […] your other middlewares
  sparql-proxy:
    module: "@zazuko/trifid-plugin-sparql-proxy"
    paths: /query
    config:
      enableProxy: true # enable support for `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY` environment variables
      sparqlEndpoint:
        url: https://example.com/query
        username: admin
        password: secret
      # …other configuration fields
```
