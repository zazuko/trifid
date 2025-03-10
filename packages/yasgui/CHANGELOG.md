# trifid-plugin-yasgui

## 3.4.4

### Patch Changes

- 5ddaa47: Bump `@zazuko/yasgui` to 4.5.0

## 3.4.3

### Patch Changes

- 84de470: Add basic support for POINT WKT elements for the Map plugin

## 3.4.2

### Patch Changes

- a23f8dd: Bump openlayers-elements to 0.4.0
- 57c85d5: Use standard `fetch` to shorten URLs
- c62f009: Upgrade Yasgui to 4.4.1

## 3.4.1

### Patch Changes

- 98ae876: Dynamic row name support for labels
- 57c2403: More contrasted colors for Map plugin

## 3.4.0

### Minor Changes

- d3d2bd2: Types are now exposed in the `dist` directory ; the builded version of the plugins are now exported in the `build` directory instead of the `dist` directory.
- d3d2bd2: Export types

### Patch Changes

- b6ad4ef: Upgrade @zazuko/yasgui to v4.4.0
- d7f35c0: Fix duplicate map shown in some specific cases.

## 3.3.2

### Patch Changes

- f0e3b13: Fix and improve types references

## 3.3.1

### Patch Changes

- 5476c37: Fix `requestPort` value, to handle `null` cases

## 3.3.0

### Minor Changes

- 007e201: Upgrade Fastify to v5.

### Patch Changes

- 080f5d8: Harmonize author and keywords fields
- a97a6a0: Use Apache 2.0 license

## 3.2.1

### Patch Changes

- 9d79fe7: Also support `xLabel` in case `wktLabel` is not defined.

## 3.2.0

### Minor Changes

- ce4ff33: A new configuration field `mapKind` has been added to the YASGUI plugin.
  This field allows to set the map kind to use in the YASGUI interface, when there are results that have the `http://www.opengis.net/ont/geosparql#wktLiteral` datatype.
  The default value is `default` and the supported values are `default` and `swisstopo`.

  If in the query a row has a column with the `http://www.opengis.net/ont/geosparql#wktLiteral` datatype, the map will be displayed with the `mapKind` specified in the configuration in the Map tab of the YASGUI interface.
  If in that row, there is a column called `wktLabel`, the value of that column will be used as the label of the map, when the geometry is clicked by the user.

### Patch Changes

- 8166a7f: Improve the Map plugin icon
- b900aea: Upgrade yasgui to 4.3.3

## 3.1.2

### Patch Changes

- 1cafa55: Return `reply` in the `routeHandler`, in order to be compatible with the support for compression.

## 3.1.1

### Patch Changes

- 7761744: Only one of multiple WKT features would be displayed on the map

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
