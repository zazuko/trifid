# @zazuko/trifid-plugin-sparql-proxy

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
