# trifid-plugin-graph-explorer

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
