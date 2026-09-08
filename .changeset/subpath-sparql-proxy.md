---
"@zazuko/trifid-plugin-sparql-proxy": minor
---

Take the subpath configured with `server.subpath` into account when rewriting
IRIs, so that query results point at the subpath the instance is served under
instead of the root of the domain.

Without this, an instance served under `/SUBPATH` with rewriting enabled would
return `https://example.com/path/resource` instead of
`https://example.com/SUBPATH/path/resource`, and the resulting IRIs would
not be dereferenceable.

This applies to the default endpoint, to the additional endpoints, and to the
per-request `rewrite` query parameter.

Nothing changes for instances that do not configure a subpath.
