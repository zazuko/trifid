# @zazuko/trifid-renderer-entity

## 1.0.3

### Patch Changes

- 04c75de: Try to get quads from the store, in order to get the graph name.

## 1.0.2

### Patch Changes

- 854eddf: Send `i18n` cookie to requests made to the SPARQL endpoint to avoid languages issues.
- Updated dependencies [3f2271d]
  - trifid-core@4.0.2

## 1.0.1

### Patch Changes

- e8faa76: Internally use the new `render` function, that takes the `request` as first argument.
- Updated dependencies [e8faa76]
  - trifid-core@4.0.0

## 1.0.0

### Major Changes

- 81c27c0: The plugin is now using the new Trifid factory, which is a breaking change.
- 4b515f8: Use 'plugins' instead of 'middlewares'

### Minor Changes

- 757621f: Remove the use of hijackresponse
- deef1a8: Add support for redirects.
- 8337a36: Support for multiple serializations

### Patch Changes

- Updated dependencies [a454dbb]
- Updated dependencies [3ab5eb3]
- Updated dependencies [69d6ad0]
- Updated dependencies [849fa3d]
- Updated dependencies [4b515f8]
- Updated dependencies [849fa3d]
- Updated dependencies [d9963cd]
- Updated dependencies [1dd9ae7]
  - trifid-core@3.0.0

## 0.6.3

### Patch Changes

- 3131369: Remove `Content-Disposition` header from response from the SPARQL endpoint.
  This header was triggering the download of the response as a file instead of displaying it in the browser.
  This was affecting Blazegraph and RDF4J as reported by some users.

  Thanks to @Tomvbe for providing the fix.

## 0.6.2

### Patch Changes

- c0576e5: Fix issue where graph name label was not shown if it is not a known prefix (closes #213)

## 0.6.1

### Patch Changes

- fae8107: Use map instead of forEach in label loader.
- 56e7977: Upgrade dependencies, update example and improve tests.
- Updated dependencies [371f4f8]
  - trifid-core@2.7.1

## 0.6.0

### Minor Changes

- 8b9d0dd: Replace the use of `rdf-ext` with `@zazuko/env`

## 0.5.1

### Patch Changes

- c283b93: Include env.js file in the package

## 0.5.0

### Minor Changes

- 9e2019c: Improve the default header

### Patch Changes

- 3a13457: Upgrade @zazuko/rdf-entity-webcomponent to 0.7.7
- 1937f67: Use @zazuko/env and upgrade dependencies
- Updated dependencies [cb227a3]
- Updated dependencies [141786b]
  - trifid-core@2.6.3

## 0.4.18

### Patch Changes

- 4a4e624: Import trifid-entity-renderer into trifid mono-repo.
- ed223f3: Format code
- 56144fd: Fix SPARQL query for label loader (#149)

## 0.4.17

### Patch Changes

- 17305c5: Rename package to @zazuko/trifid-entity-renderer.

## 0.4.16

### Patch Changes

- 949ac41: Remove duplicates values in HTML render
