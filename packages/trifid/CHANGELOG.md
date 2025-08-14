# trifid

## 5.1.0

### Minor Changes

- 7d21f77: Add OpenTelemetry support.

  Just start Trifid with the `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable set to your OpenTelemetry endpoint, like `https://example.com/v1/traces`.

### Patch Changes

- Updated dependencies [7d21f77]
  - trifid-core@5.2.0

## 5.0.12

### Patch Changes

- 98fee3a: Upgrade `@fastify/compress` to 8.1.0 so that it supports zstd
- Updated dependencies [98fee3a]
- Updated dependencies [a421a32]
  - trifid-core@5.1.2
  - @zazuko/trifid-plugin-sparql-proxy@2.7.0

## 5.0.11

### Patch Changes

- d743dbb: Upgrade some dependencies
- Updated dependencies [23bd23e]
  - @zazuko/trifid-plugin-sparql-proxy@2.6.2

## 5.0.10

### Patch Changes

- 5ddaa47: Bump `@zazuko/yasgui` to 4.5.0
- Updated dependencies [5ddaa47]
- Updated dependencies [a190193]
  - trifid-plugin-yasgui@3.4.4
  - @zazuko/trifid-entity-renderer@1.5.3

## 5.0.9

### Patch Changes

- Updated dependencies [499601f]
  - trifid-plugin-spex@3.0.0

## 5.0.8

### Patch Changes

- e3d7ac0: Upgrade container base image from Node 20 to 22.
- 080f5d8: Harmonize author and keywords fields
- a97a6a0: Use Apache 2.0 license
- Updated dependencies [080f5d8]
- Updated dependencies [a97a6a0]
- Updated dependencies [007e201]
  - @zazuko/trifid-entity-renderer@1.4.0
  - trifid-plugin-graph-explorer@2.1.0
  - trifid-handler-fetch@3.3.3
  - @zazuko/trifid-plugin-sparql-proxy@2.5.0
  - trifid-plugin-yasgui@3.3.0
  - trifid-core@5.1.0
  - trifid-plugin-i18n@3.0.2
  - trifid-plugin-spex@2.2.0

## 5.0.7

### Patch Changes

- Updated dependencies [1cafa55]
- Updated dependencies [1cafa55]
- Updated dependencies [7729ed7]
  - @zazuko/trifid-entity-renderer@1.2.1
  - trifid-plugin-graph-explorer@2.0.3
  - trifid-handler-fetch@3.3.1
  - @zazuko/trifid-plugin-sparql-proxy@2.4.0
  - trifid-plugin-yasgui@3.1.2
  - trifid-core@5.0.0
  - trifid-plugin-spex@2.1.1

## 5.0.6

### Patch Changes

- d6a9f4d: Add more labels to the Docker image

## 5.0.5

### Patch Changes

- 096b762: Upgrade some dependencies, like `braces` to 3.0.3.

## 5.0.4

### Patch Changes

- 9aa5280: Faster default health checks on `/healthz` by using the Docker image
- Updated dependencies [7442b22]
- Updated dependencies [cba7676]
- Updated dependencies [2346a1c]
  - @zazuko/trifid-entity-renderer@1.1.1
  - trifid-handler-fetch@3.1.0
  - trifid-core@4.0.6

## 5.0.3

### Patch Changes

- 6382598: Remove unused dependency `@zazuko/trifid-handle-redirects`
- Updated dependencies [b499b50]
- Updated dependencies [009d545]
- Updated dependencies [8345cab]
- Updated dependencies [2c15b93]
- Updated dependencies [c2b4053]
- Updated dependencies [3977304]
- Updated dependencies [24b3eab]
  - @zazuko/trifid-plugin-sparql-proxy@2.1.0
  - trifid-core@4.0.5
  - @zazuko/trifid-entity-renderer@1.0.4
  - trifid-plugin-yasgui@3.1.0

## 5.0.2

### Patch Changes

- d5ade95: Upgrade dependencies
- Updated dependencies [04c75de]
  - @zazuko/trifid-entity-renderer@1.0.3

## 5.0.1

### Patch Changes

- Updated dependencies [e8faa76]
- Updated dependencies [2553ece]
- Updated dependencies [e8faa76]
  - trifid-core@4.0.0
  - @zazuko/trifid-plugin-sparql-proxy@2.0.1
  - @zazuko/trifid-entity-renderer@1.0.1
  - trifid-plugin-graph-explorer@2.0.2
  - trifid-plugin-yasgui@3.0.2
  - trifid-plugin-spex@2.0.2

## 5.0.0

### Major Changes

- c5999e9: Remove the `trifid-handler-sparql` package
- 4b515f8: Use 'plugins' instead of 'middlewares'
- 00cecaa: Remove morgan logger.

### Minor Changes

- 1f2e258: Allow to start Trifid using the CLI without requiring a path to a configuration file.

### Patch Changes

- Updated dependencies [a454dbb]
- Updated dependencies [6583c86]
- Updated dependencies [3ab5eb3]
- Updated dependencies [69d6ad0]
- Updated dependencies [b38cbc5]
- Updated dependencies [81c27c0]
- Updated dependencies [849fa3d]
- Updated dependencies [757621f]
- Updated dependencies [4b515f8]
- Updated dependencies [849fa3d]
- Updated dependencies [d9963cd]
- Updated dependencies [0eaf2b7]
- Updated dependencies [0f21191]
- Updated dependencies [e069220]
- Updated dependencies [b635ae9]
- Updated dependencies [deef1a8]
- Updated dependencies [8337a36]
- Updated dependencies [e65e519]
- Updated dependencies [b38cbc5]
- Updated dependencies [1dd9ae7]
- Updated dependencies [538a959]
- Updated dependencies [293d7e6]
  - trifid-core@3.0.0
  - trifid-plugin-graph-explorer@2.0.0
  - trifid-handler-fetch@3.0.0
  - @zazuko/trifid-plugin-sparql-proxy@2.0.0
  - @zazuko/trifid-entity-renderer@1.0.0
  - trifid-plugin-yasgui@3.0.0
  - trifid-plugin-i18n@3.0.0
  - trifid-plugin-spex@2.0.0

## 4.1.1

### Patch Changes

- 7c1c443: Fix build issue where tags were not created the expected way.

## 4.1.0

### Minor Changes

- 83487f9: The Docker image now uses node 20 as base

## 4.0.3

### Patch Changes

- Updated dependencies [7940ded]
- Updated dependencies [8b9d0dd]
  - trifid-plugin-spex@1.1.4
  - @zazuko/trifid-entity-renderer@0.6.0

## 4.0.2

### Patch Changes

- Updated dependencies [cb227a3]
- Updated dependencies [9e2019c]
- Updated dependencies [3a13457]
- Updated dependencies [1937f67]
- Updated dependencies [141786b]
  - trifid-core@2.6.3
  - @zazuko/trifid-entity-renderer@0.5.0
  - @zazuko/trifid-plugin-sparql-proxy@1.1.1

## 4.0.1

### Patch Changes

- 8d1f155: Fix build of Docker image
- Updated dependencies [db20277]
  - trifid-plugin-yasgui@2.2.4

## 4.0.0

### Major Changes

- bb80ca9: Use `@zazuko/trifid-entity-renderer` instead of `@zazuko/trifid-renderer-entity`

  You will need to do the change in your configuration file:

  ```diff
   middlewares:
     # …

     entity-renderer:
  -    module: "@zazuko/trifid-renderer-entity"
  +    module: "@zazuko/trifid-entity-renderer"
  ```

### Patch Changes

- Updated dependencies [4a4e624]
- Updated dependencies [ed223f3]
- Updated dependencies [56144fd]
  - @zazuko/trifid-entity-renderer@0.4.18

## 3.0.0

### Patch Changes

- fc317a9: Upgrade commander and some other dependencies.
- Updated dependencies [735bf99]
  - trifid-core@2.6.2
