---
"trifid-plugin-graph-explorer": patch
---

Resolve the Graph Explorer assets without a trailing slash.

`graph-explorer` ships no `exports` field, so this specifier did not trigger the
`DEP0155` deprecation warning yet, but it would as soon as the package adds one.

The resolved directory, and therefore the files being served, are unchanged.
