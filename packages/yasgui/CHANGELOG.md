# trifid-plugin-yasgui

## 3.1.0

### Minor Changes

- c2b4053: It is now possible to configure the default SPARQL query to use in each new YASGUI tab, by configuring the `defaultQuery` configuration field.

  This feature is useful to provide a starting point for users who are not familiar with SPARQL queries and want to explore the data available in the SPARQL endpoint.

  You can define the default query in order to show a specific set of triples, or to show a specific number of triples, or to show a specific set of properties, etc. based on your data model.

  It can be also useful to also include common prefixes in the default query, so users can start writing their queries without having to remember the prefixes.

- 3977304: Add `catalog` option, to configure the list of endpoints to show by default in the YASGUI interface.

### Patch Changes

- 24b3eab: Upgrade Yasgui to v4.3.0

## 3.0.3

### Patch Changes

- 1605f62: Update link to GitHub repository for the plugin.

## 3.0.2

### Patch Changes

- e8faa76: Internally use the new `render` function, that takes the `request` as first argument.

## 3.0.1

### Patch Changes

- 195cb7b: Bump import-meta-resolve from 3.0.0 to 4.0.0

## 3.0.0

### Major Changes

- 4b515f8: Use 'plugins' instead of 'middlewares'
- b635ae9: The plugin is now using the new Trifid factory, which is a breaking change.

## 2.2.6

### Patch Changes

- 34b3ffb: Upgrade @zazuko/yasgui to v4.2.34

## 2.2.5

### Patch Changes

- 3aeb88e: Upgrade @zazuko/yasgui to 4.2.32

## 2.2.4

### Patch Changes

- db20277: Upgrade @zazuko/yasgui to 4.2.31
