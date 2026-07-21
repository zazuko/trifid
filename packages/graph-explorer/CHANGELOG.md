# trifid-plugin-graph-explorer

## 3.1.0

### Minor Changes

- 94215c3: Support Graph Explorer 2.0, which is built with React 19 and bundles its own copy of React.

  The page used to load React 16 from a CDN and mount the workspace with the `ReactDOM.render` API, which was removed in React 18. Since the `graph-explorer-full.min.js` bundle now ships React 19 itself, the CDN scripts are gone and the workspace is mounted with the `renderTo` helper exposed by the library.

  The explorer now also fills the whole viewport between the Trifid header and footer instead of being constrained to a fixed 750px height inside the centered content column.

## 3.0.0

### Major Changes

- 3c9ceba: Convert the whole codebase into TypeScript.

  This is is marked as a major change, as some imports may need to be updated.

## 2.2.0

### Minor Changes

- 65a2625: Make the title configurable.

## 2.1.2

### Patch Changes

- f0e3b13: Fix and improve types references

## 2.1.1

### Patch Changes

- 724f2ed: Fix `requestPort` value, to handle `null` cases and simplify the logic

## 2.1.0

### Minor Changes

- 007e201: Upgrade Fastify to v5.

### Patch Changes

- 080f5d8: Harmonize author and keywords fields
- a97a6a0: Use Apache 2.0 license

## 2.0.4

### Patch Changes

- 4e21e24: Add integrity hash to external resources

## 2.0.3

### Patch Changes

- 1cafa55: Return `reply` in the `routeHandler`, in order to be compatible with the support for compression.

## 2.0.2

### Patch Changes

- e8faa76: Internally use the new `render` function, that takes the `request` as first argument.

## 2.0.1

### Patch Changes

- 195cb7b: Bump import-meta-resolve from 2.2.2 to 4.0.0

## 2.0.0

### Major Changes

- 6583c86: The plugin is now using the new Trifid factory, which is a breaking change.

  Assets are served under `/graph-explorer/assets/` and `/graph-explorer/static/` instead of `/graph-explorer-assets/` and `/graph-explorer-static/`.

- 4b515f8: Use 'plugins' instead of 'middlewares'
