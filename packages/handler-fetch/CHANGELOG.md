# trifid-handler-fetch

## 3.3.2

### Patch Changes

- 7d6a17a: Upgrade Oxigraph to 0.4.0-rc.1.

## 3.3.1

### Patch Changes

- 1cafa55: Return `reply` in the `routeHandler`, in order to be compatible with the support for compression.

## 3.3.0

### Minor Changes

- cb5e6b9: It is now possible to configure the log level of the queries by using the `queryLogLevel` configuration option.

## 3.2.0

### Minor Changes

- 6a4dcfc: Returns `Server-Timing` as response header containing the duration of the request to perform.

## 3.1.0

### Minor Changes

- cba7676: Upgrade `oxigraph` to 0.4.0-alpha.7

## 3.0.0

### Major Changes

- 4b515f8: Use 'plugins' instead of 'middlewares'
- 0eaf2b7: Completely change the way it is working.

  Instead of being an handler that is made to be called only when dereferencing, it is now a Trifid plugin that is exposing a new endpoint `/query` (for example) that can be used to perform SPARQL queries against the dataset.

  This means that it is now possible to perform SPARQL queries against a dataset that is loaded from a URL, which was not possible before.
  This also means that it is possible to use all other Trifid plugins that were only working with a SPARQL endpoint and not with a dataset coming from a simple file.

  Please take a look on how to use it in the documentation here: https://github.com/zazuko/trifid/tree/main/packages/handler-fetch#readme

- 293d7e6: The plugin is now using the new Trifid factory, which is a breaking change.

### Patch Changes

- 69d6ad0: Improve included TypeScript types.
- e65e519: Support `unionDefaultGraph` configuration
