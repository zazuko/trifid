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
      endpointUrl: https://example.com/query
      # The following fields are not required:
      username: admin
      password: secret
```
