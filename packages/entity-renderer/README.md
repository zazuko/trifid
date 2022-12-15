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
    config:
      # ignore some specific paths
      ignorePaths:
        - /query
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

## Rendering options

Under the hood, this plugin uses [rdf-entity-webcomponent](https://github.com/zazuko/rdf-entity-webcomponent), that
accepts the same configuration options.

Add any of these options under the config section

```yaml
middlewares:
  # […]
  entity-renderer:
    module: "@zazuko/trifid-renderer-entity"
    config:
      compactMode: false
      technicalCues: true
      embedNamedNodes: false
```

## Run an example instance

```sh
npm run example-instance
```
