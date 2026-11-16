# trifid-plugin-ldforge

Native [LDForge](https://github.com/mightymax/ldforge) SPARQL editor for Trifid.
The browser bundle is built from the published LDForge packages and served locally.

```yaml
plugins:
  ldforge:
    module: trifid-plugin-ldforge
    paths: [/sparql, /sparql/]
    config:
      endpointUrl: /query
      catalog: [https://query.wikidata.org/sparql]
      defaultQuery: SELECT * WHERE { ?s ?p ?o } LIMIT 10
```

## Configuration

- `endpointUrl`: absolute endpoint URL or relative URL. Defaults to `/query` under
  the configured Trifid subpath. Relative URLs resolve against the browser page.
- `catalog`: array of endpoint URL strings, shown as endpoint input suggestions.
- `defaultQuery`: initial query when no saved workspace exists.
- `template`: optional replacement Handlebars template. It receives `editorConfig`,
  HTML-safe JSON to embed in a script with ID `ldforge-config` and type
  `application/json`. Retain the DOM IDs in `views/ldforge.hbs`.
- `mapKind`: `default` (OpenStreetMap) or `swisstopo` (Swiss national map).
- `urlShortener`: optional service for the Copy short link button. Receives a POST
  with JSON `{ "url": "…" }` and returns the short HTTP(S) URL as plain text.

## Features

CodeMirror SPARQL editing, query tabs, completion, prefix management, formatting,
query cancellation, CSV downloads, sharing and the LDForge plugin wizard.
Queries, tabs and the applied endpoint are saved in localStorage per Trifid path.
Storage restrictions do not prevent editing. Shared `?query=…` links open in a new
tab without executing automatically. On explicit execution, portable
`# sparql-endpoint=…` query headers select their declared endpoint.

The result bar shows Table, JSON, Map and Pivot directly. Other registered
renderers remain available in the renderer menu.

Result plugins: table, boolean, JSON, cards, charts, map (including clustering,
heatmaps and 3D), network, timeline, pivot and tree. Visual libraries are loaded
on demand by LDForge from their default CDNs; map tiles require network access.
The core editor and its styles are served by Trifid.

Build from the repository root with `pnpm install && pnpm build`. For development,
`pnpm dev` builds the editor assets and starts the bundled TBBT example with file
watching at http://127.0.0.1:8081/sparql/.

This plugin is an alternative to `trifid-plugin-yasgui`, which remains available
with its original API and assets. Existing configurations can keep using that
plugin. To opt into LDForge, change the module to `trifid-plugin-ldforge` and
adapt custom templates to the DOM/config contract above. Browser storage is
separate for the two editors; existing queries are not automatically migrated.
Graph Explorer, SPEX and the other Trifid plugins are unchanged.

Both plugins can run in one Trifid instance with distinct paths:

```yaml
plugins:
  ldforge:
    module: trifid-plugin-ldforge
    paths: [/sparql, /sparql/]
  yasgui:
    module: trifid-plugin-yasgui
    paths: [/yasgui, /yasgui/]
```

The development preview uses this setup: LDForge at `/sparql/` and Yasgui at
`/yasgui/`. Each plugin serves its own assets under separate URL prefixes.

LDForge is the default editor in the bundled examples. There is **no automatic
fallback to Yasgui** on editor or query errors. Users can open `/yasgui/` manually
when that route is configured; outside the development preview it must be added
explicitly. To make Yasgui the default instead, change the module of the existing
editor entry to `trifid-plugin-yasgui` and keep its `/sparql` and `/sparql/` paths.
Do not configure both editors on the same paths. See the root README's
[editor configuration](../../README.md#default-editor-and-yasgui-alternative).
