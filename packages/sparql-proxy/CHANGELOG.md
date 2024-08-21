# @zazuko/trifid-plugin-sparql-proxy

## 2.4.0

### Minor Changes

- 7729ed7: Serve a [SPARQL 1.1 Service Description](https://www.w3.org/TR/sparql11-service-description/), proxied from the original server (fixes #461)

### Patch Changes

- 1cafa55: Return `reply` in the `routeHandler`, in order to be compatible with the support for compression.
- Updated dependencies [1cafa55]
- Updated dependencies [1cafa55]
  - trifid-core@5.0.0

## 2.3.0

### Minor Changes

- 7ab85d4: It is now possible to configure the log level of the queries by using the `queryLogLevel` configuration option.

## 2.2.0

### Minor Changes

- f0452b1: Returns `Server-Timing` as response header containing the duration of the request to the configured endpoint.

### Patch Changes

- Updated dependencies [b03bdb5]
- Updated dependencies [eff233a]
  - trifid-core@4.0.7

## 2.1.0

### Minor Changes

- b499b50: Add a `formats` configuration field, to manually configure the list of allowed formats that can be provided as query parameter. The SPARQL endpoint will need to support the specified formats.

### Patch Changes

- Updated dependencies [009d545]
  - trifid-core@4.0.5

## 2.0.1

### Patch Changes

- 2553ece: Fix an issue with the rewrite query parameter, where it was assuming that undefined value was equal to 'true'
- Updated dependencies [e8faa76]
  - trifid-core@4.0.0

## 2.0.0

### Major Changes

- b38cbc5: The plugin is now using the new Trifid factory, which is a breaking change.
- 4b515f8: Use 'plugins' instead of 'middlewares'
- b38cbc5: The plugin was completely restructured to remove extra complexity.

### Patch Changes

- 538a959: Upgrade proxy-agent to 6.4.0
- Updated dependencies [a454dbb]
- Updated dependencies [3ab5eb3]
- Updated dependencies [69d6ad0]
- Updated dependencies [849fa3d]
- Updated dependencies [4b515f8]
- Updated dependencies [849fa3d]
- Updated dependencies [d9963cd]
- Updated dependencies [1dd9ae7]
  - trifid-core@3.0.0

## 1.2.0

### Minor Changes

- 5d9df9f: Add support for `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY` environment variables with the new configuration property `enableProxy` set to `true` (close #174)

## 1.1.1

### Patch Changes

- 141786b: Upgrade dependencies
