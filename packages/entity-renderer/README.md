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
  entity-renderer:
    module: "@zazuko/trifid-renderer-entity"
```

## Define your own css/template

Specify the path where the handlebars template is located

```yaml
middlewares:
  # […]
  entity-renderer:
    module: "@zazuko/trifid-renderer-entity"
    config:
      path: file:./some-path/your-template.hbs
```

## Run an example instance

```sh
npm run example-instance
```
