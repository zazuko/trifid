# Trifid plugin to render entities

## Quick start

Install this Trifid plugin using:

```sh
npm install @zazuko/trifid-entity-renderer
```

And then add in the `config.yaml` file the following part:

```yaml
plugins:
  # […]
  entity-renderer:
    module: "@zazuko/trifid-entity-renderer"
    config:
      # ignore some specific paths
      ignorePaths:
        - /query
```

## Define your own css/template

Specify the path where the handlebars template is located:

```yaml
plugins:
  # […]
  entity-renderer:
    module: "@zazuko/trifid-entity-renderer"
    config:
      path: file:./some-path/your-template.hbs
```

## Rendering options

Under the hood, this plugin uses [rdf-entity-webcomponent](https://github.com/zazuko/rdf-entity-webcomponent), that accepts the same configuration options.

Add any of these options under the config section:

```yaml
plugins:
  # […]
  entity-renderer:
    module: "@zazuko/trifid-entity-renderer"
    config:
      compactMode: false
      technicalCues: true
      embedNamedNodes: false
```

## Rewriting

You can configure if the plugin needs to perform any rewriting on the result to the SPARQL queries.

You can use the following configuration option `rewrite` and set it to one of those value:

- `auto` (default value): if the `datasetBaseUrl` configuration value is defined (globally or at the scope of this plugin), then it will behaves as if the value was set to `true`, else like `false`
- `true`: rewrite the result of the SPARQL queries by replacing the `datasetBaseUrl` value with the current domain.
- `false`: this will disable the rewriting mechanism. This is useful if your triples are already matching the domain name where your Trifid instance is deployed.

## Follow redirects

Using SPARQL it is possible to define some redirects.
This plugin can follow those redirects and render the final resource, if the `followRedirects` configuration option is set to `true`.

The default value is `false`.

```yaml
plugins:
  # […]
  entity-renderer:
    module: "@zazuko/trifid-entity-renderer"
    config:
      followRedirects: true
      redirectQuery: "…" # Select query used to get the redirect target ; needs to return a row with `?responseCode` and `?location` bindings.
```

The default redirect query supports `http://www.w3.org/2011/http#` and `http://www.w3.org/2006/http#` prefixes.

## Other configuration options

- `resourceExistsQuery`: The `ASK` query to check whether the resources exists or not
- `resourceGraphQuery`: The query to fetch the actual triples of the resource
- `containerExistsQuery`: The `ASK` query to check whether the container exists or not
- `containerGraphQuery`: The query to fetch the actual triples of the container
- `resourceNoSlash`: The handler will also check if there is a resource with a URL ending with a slash before running the container logic.
  Set this option to true to disable the resource exists query.
  Useful if you know there are no triples with container URLs.
- `additionalRewrites`: An array of additional rewrite rules, in case the default rewriting is enabled but it not enough.
  Each rule is either a string or an object with the following properties:
  - `find`: the string to find
  - `replace`: the string to replace with (optional, the default value will be the current hostname)
- `enableSchemaUrlRedirect`: If set to `true`, the plugin will perform a redirect if the URI contains a `schema:URL` predicate pointing to a resource of type `xsd:anyURI`.
  The default value is `false`.
  If enabled, the user can still disable this behavior by either:
  - setting the `disableSchemaUrlRedirect` query parameter to `true`
  - setting the `x-disable-schema-url-redirect` header to `true`
- `allowEndpointSwitch`: If set to `true`, the plugin will allow the user to switch the endpoint by setting the `endpoint` query parameter.
  This will inject a `endpointName` cookie while querying the SPARQL endpoint and is meant to be used with the `sparql-proxy` Trifid plugin.
  The default value is `false`.
  This option is experimental and might change or be removed in the future.

## Run an example instance

```sh
npm run example-instance
```

And go to http://localhost:3000/ to see the result.
