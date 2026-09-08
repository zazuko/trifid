---
"@zazuko/trifid-entity-renderer": minor
---

Take the subpath configured with `server.subpath` into account when mapping a
request to a dataset IRI, and when rewriting the IRIs of the response.

A request for `https://example.com/SUBPATH/path/resource` now resolves the
IRI `http://example.org/path/resource`, and the rendered entity links back to
the subpath-prefixed URLs.

Nothing changes for instances that do not configure a subpath.
