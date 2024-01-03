---
"trifid-handler-fetch": major
---

Completely change the way it is working.

Instead of being an handler that is made to be called only when dereferencing, it is now a Trifid middleware that is exposing a new endpoint `/query` (for example) that can be used to perform SPARQL queries against the dataset.

This means that it is now possible to perform SPARQL queries against a dataset that is loaded from a URL, which was not possible before.
This also means that it is possible to use all other Trifid plugins that were only working with a SPARQL endpoint and not with a dataset coming from a simple file.

Please take a look on how to use it in the documentation here: https://github.com/zazuko/trifid/tree/main/packages/handler-fetch#readme
