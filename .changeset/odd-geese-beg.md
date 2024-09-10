---
"trifid-plugin-yasgui": minor
---

A new configuration field `mapKind` has been added to the YASGUI plugin.
This field allows to set the map kind to use in the YASGUI interface, when there are results that have the `http://www.opengis.net/ont/geosparql#wktLiteral` datatype.
The default value is `default` and the supported values are `default` and `swisstopo`.

If in the query a row has a column with the `http://www.opengis.net/ont/geosparql#wktLiteral` datatype, the map will be displayed with the `mapKind` specified in the configuration in the Map tab of the YASGUI interface.
If in that row, there is a column called `wktLabel`, the value of that column will be used as the label of the map, when the geometry is clicked by the user.
