# trifid-plugin-yasgui

YASGUI for Trifid.
This plugin does the static file hosting for all YASGUI files and renders an index page that points to the given endpoint URL.

## Quick start

Install this Trifid plugin using:

```sh
npm install trifid-plugin-yasgui
```

And then add in the `config.yaml` file the following part:

```yaml
plugins:
  # […] your other plugins
  yasgui:
    module: trifid-plugin-yasgui
    paths: # by default
      - /sparql
      - /sparql/
    config:
      endpointUrl: https://example.com/query
      urlShortener: https://example.com/api/v1/shorten
      defaultQuery: |
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        SELECT * WHERE {
          ?sub ?pred ?obj .
        } LIMIT 10
      # …other configuration fields
```

## Configuration

The following options are supported:

- `endpointUrl`: URL to the SPARQL endpoint which will be used in the YASGUI interface. If a path is given instead of a URL, it will be resolved using the absolute URL (default value: `/query`)
- `urlShortener`: URL of an URL Shortener service. It will be called like this (assuming `urlShortener` is `https://example.com/api/v1/shorten`): `https://example.com/api/v1/shorten?url=url-to-your-query` and should return a short URL as plain text (`https://example.com/s/x8Z1a`). If `urlShortener` is not defined, the short URL feature will be disabled in YASGUI.
- `template`: Path to an alternative template (default: `views/yasgui.hbs`)
- `catalog`: Array of SPARQL endpoints that will be shown in the YASGUI interface.
- `defaultQuery`: Default query that will be shown in the YASGUI interface.
- `mapKind`: Map kind to use in the YASGUI interface (default: `default` ; supported values: `default`, `swisstopo`)

## Result plugins

On top of the plugins provided by YASGUI, this Trifid plugin registers two additional ways to look at the results of a query.

### Map

Renders the geometries of the result set on a [Leaflet](https://leafletjs.com/) map.
It picks up every value typed as `geo:wktLiteral` (`http://www.opengis.net/ont/geosparql#wktLiteral`), and all the geometry types of WKT are supported.
Coordinates are expected to be WGS84 (`EPSG:4326`).

Clicking a geometry opens a popup with the other values of the row it comes from.
If a `<column>Label` column exists next to a geometry column, its value is used as the title of that popup.

The base map is controlled by the `mapKind` option: `swisstopo` uses the Swisstopo tiles, and lets users switch between the national map and the aerial imagery, while any other value uses OpenStreetMap tiles.

### Pivot

Cross-tabulates the result set: pick a variable for the rows, one for the columns, and an aggregation (count, count unique, sum, average, minimum or maximum) to compute for every cell.
Totals are computed for each row and column.
This is useful to summarise a result set without having to write a new query with `GROUP BY`.
