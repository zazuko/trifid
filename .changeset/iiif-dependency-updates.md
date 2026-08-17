---
"@zazuko/trifid-plugin-iiif": patch
---

Update dependencies: `through2` to `^5.0.11` and `@tpluscode/rdf-string` to `^1.3.4`.

The `through2` major bump is an internal implementation detail — only `through2.obj()`
is used, its signature is unchanged, and the new major adds no engine constraint.
