# trifid-plugin-ontodia

Ontodia for Trifid.
This middleware does the static file hosting for all Ontodia files and renders an index page that points to the given endpoint URL.
 
# Usage

The following options are supported:

- `endpointUrl`: URL to the SPARQL endpoint which will be used in the YASGUI interface
- `template`: Path to an alternative template (default: `views/index.html`)

Configuring Trifid to use `trifid-plugin-ontodia` is done the same way as `trifid-plugin-yasgui`.
Since Trifid provides an example config using `trifid-plugin-yasgui`:
[`config-sparql.json`](https://github.com/zazuko/trifid/blob/1946e324c5a8340b6de5526fae5344e79aa024f2/config-sparql.json),
here is how to configure `trifid-plugin-ontodia` by simply duplicating the YASGUI config parts:

```diff
  "yasgui": {
    "default": {
      "path": "/sparql"
    }
  },
+ "ontodia": {
+   "default": {
+     "path": "/ontodia"
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
+   "ontodia": {},
+   "ontodia.default": {},
+   "ontodia.default.endpointUrl": [
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
+   "ontodia": {
+     "priority": 115,
+     "module": "trifid-plugin-ontodia"
+   }
  }
}
```
