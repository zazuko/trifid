# Trifid plugin to render entities

## Quick start

Install this Trifid plugin using:

```sh
npm install @zazuko/trifid-renderer-entity
```

And then add in the `config.yaml` file the following part:

```yaml
middlewares:
  # […]
  sparql-proxy:
    module: "@zazuko/trifid-renderer-entity"
```
