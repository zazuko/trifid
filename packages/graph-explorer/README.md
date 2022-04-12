# trifid-plugin-graph-explorer

[Graph Explorer](https://github.com/zazuko/graph-explorer) for [Trifid](https://github.com/zazuko/trifid).
This middleware does the static file hosting for all Graph Explorer files and renders an index page that points to the given endpoint URL.

# Usage

The following options are supported:

- `endpointUrl`: URL to the SPARQL endpoint which will be used in the YASGUI interface
- `template`: Path to an alternative template (default: `views/index.html`)
- `acceptBlankNodes`: Show blank nodes

Configuring Trifid to use `trifid-plugin-graph-explorer` is done the same way as `trifid-plugin-yasgui`.
Since Trifid provides an example config using `trifid-plugin-yasgui`:
[`config-sparql.json`](https://github.com/zazuko/trifid/blob/1946e324c5a8340b6de5526fae5344e79aa024f2/config-sparql.json),
here is how to configure `trifid-plugin-graph-explorer` by simply duplicating the YASGUI config parts:

```diff
  "yasgui": {
    "default": {
      "path": "/sparql"
    }
  },
+ "graphexplorer": {
+   "default": {
+     "path": "/graph-explorer",
+     "acceptBlankNodes": false,
+     "dataLabelProperty": "rdfs:label | <http://schema.org/name>",
+     "schemaLabelProperty": "rdfs:label | <http://schema.org/name>",
+     "language": "en",
+     "languages": [
+       {
+         "code": "en",
+         "label": "English"
+       },
+       {
+         "code": "de",
+         "label": "German"
+       },
+       {
+         "code": "fr",
+         "label": "French"
+       },
+       {
+         "code": "it",
+         "label": "Italian"
+       }
+     ]
+   }
+ },
  "breakDown": {
    "handler": {},
    "handler.root": {},
    "handler.root.options": {},
    "handler.root.options.endpointUrl": "sparqlEndpointUrl",
    "handler.root.options.authentication": "sparqlEndpointAuthentication",
    "sparqlProxy": {},
    "sparqlProxy.default": {},
    "sparqlProxy.default.endpointUrl": "sparqlEndpointUrl",
    "sparqlProxy.default.authentication": "sparqlEndpointAuthentication",
    "yasgui": {},
    "yasgui.default": {},
    "yasgui.default.endpointUrl": [
      "sparqlProxy.default.path",
      "sparqlEndpointUrl"
    ],
+   "graphexplorer": {},
+   "graphexplorer.default": {},
+   "graphexplorer.default.endpointUrl": [
+     "sparqlProxy.default.path",
+     "sparqlEndpointUrl"
+   ]
  },
  "plugins": {
    "sparqlProxy": {
      "priority": 115,
      "module": "trifid-core:./plugins/middleware",
      "middleware": "sparql-proxy"
    },
    "yasgui": {
      "priority": 115,
      "module": "trifid-plugin-yasgui"
    },
+   "graphexplorer": {
+     "priority": 115,
+     "module": "trifid-plugin-graph-explorer"
+   }
  }
}
```
