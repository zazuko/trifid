---
"trifid-plugin-yasgui": minor
---

Use Leaflet instead of OpenLayers for the map plugin, add a pivot table plugin, and restyle the YASGUI interface.

The `@openlayers-elements/maps` and `@openlayers-elements/swisstopo` dependencies are replaced by `leaflet`, with `betterknown` handling the WKT parsing that OpenLayers used to provide. This makes the lazily loaded map bundle roughly 2.5 times smaller.

The `mapKind` option is unchanged: `swisstopo` keeps using the Swisstopo tiles, which are consumed as plain Web Mercator (EPSG:3857) tiles instead of going through a WMTS capabilities document, and any other value uses OpenStreetMap tiles.

The map also gained a few things: feature labels are now shown in a popup attached to the geometry, together with the other values of the row it comes from, instead of a fixed overlay in the corner of the map. Geometries are highlighted on hover, all WKT geometry types are rendered (the previous implementation only placed markers for `POINT` explicitly), and the map has a scale, a fullscreen toggle and, for `swisstopo`, a switch between the national map and the aerial imagery.

A new `Pivot` result plugin cross-tabulates the result set: rows, columns and an aggregation (count, count unique, sum, average, minimum or maximum) can be picked from the variables of the query, with totals per row and column.

Finally, the interface got a pass of styling to match the rest of Trifid: the endpoint input and its clear button now line up with the right edge of the query editor, the table of results got readable spacing, row separators, a quieter header and a row number gutter that no longer collides with the first value, and the tab settings panel behind the gear icon was restyled.

That panel was also drawn below the map. Leaflet gives its panes and controls z-indexes between 400 and 1000, and since its container did not establish a stacking context, those competed with the rest of the page instead of staying inside the map.

Note that the browser bundles of the plugins are now wrapped in an IIFE. They used to be built as ES modules but loaded as classic scripts, which leaked every top level binding of the bundle as a global, where they could collide with the globals of the other scripts of the page.
