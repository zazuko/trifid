---
"@zazuko/trifid-entity-renderer": patch
---

If `enableSchemaUrlRedirect` configuration option is set to `true`, the plugin is performing a redirect if the URI contains a `schema:URL` predicate pointing to a resource of type `xsd:anyURI` (already in place).

The user can now disable this behavior by either:

- setting the `disableSchemaUrlRedirect` query parameter to `true`
- setting the `x-disable-schema-url-redirect` header to `true`
