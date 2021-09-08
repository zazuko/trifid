# trifid-plugin-spex

[SPEX](https://github.com/zazuko/spex) for Trifid.

This middleware does the static file hosting for all SPEX files and renders an index page that points to the given endpoint URL.

# Usage

Options provided under `spex.<pluginInstance>.options` will be passed directly to SPEX.

The following options are supported (all of them optional):

- `url`: URL to the SPARQL endpoint which will be used in the SPEX interface
- `user`: User to connect to the SPARQL endpoint
- `password`: Password to connect to the SPARQL endpoint
- `graph`: Default graph to display
- `prefixes`: List of custom prefixes (e.g. `[{ prefix: 'ex', url: 'http://example.org' }]`)

Configuring Trifid to use `trifid-plugin-spex` is done the same way as `trifid-plugin-yasgui`.
Since Trifid provides an example config using `trifid-plugin-yasgui`:
[`config-sparql.json`](https://github.com/zazuko/trifid/blob/1946e324c5a8340b6de5526fae5344e79aa024f2/config-sparql.json),
here is how to configure `trifid-plugin-spex` by simply duplicating the YASGUI config parts:

```diff
  "yasgui": {
    "default": {
      "path": "/sparql"
    }
  },
+ "spex": {
+   "default": {
+     "path": "/spex",
+     "options": {
+       "prefixes": [
+         {"prefix": "ex", "url": "http://example.org/"}
+       ]
+     }
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
+   "spex": {},
+   "spex.default": {},
+   "spex.default.options": {},
+   "spex.default.options.url": [
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
+   "spex": {
+     "priority": 115,
+     "module": "trifid-plugin-spex"
+   }
  }
}
```
