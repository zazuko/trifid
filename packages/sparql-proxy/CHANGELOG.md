# @zazuko/trifid-plugin-sparql-proxy

## 2.6.0

### Minor Changes

- d3bc56f: Add support for multiple endpoints

## 2.5.2

### Patch Changes

- 3b59e77: Export types
- f0e3b13: Fix and improve types references

## 2.5.1

### Patch Changes

- 724f2ed: Fix `requestPort` value, to handle `null` cases and simplify the logic

## 2.5.0

### Minor Changes

- 007e201: Upgrade Fastify to v5.

### Patch Changes

- 080f5d8: Harmonize author and keywords fields
- a97a6a0: Use Apache 2.0 license
- Updated dependencies [080f5d8]
- Updated dependencies [a97a6a0]
- Updated dependencies [007e201]
  - trifid-core@5.1.0

## 2.4.4

### Patch Changes

- c5ef560: Fixes Service Description to only respond to requests without **any** query strings, as it is required by the [spec](https://www.w3.org/TR/2013/REC-sparql11-service-description-20130321/#accessing).

## 2.4.3

### Patch Changes

- 79a91eb: Fix issues in case of DestroyableTransform

## 2.4.2

### Patch Changes

- a257043: Enable stream support back

## 2.4.1

### Patch Changes

- b986500: Include missing `lib` directory

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
