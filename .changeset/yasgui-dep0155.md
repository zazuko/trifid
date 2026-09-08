---
"trifid-plugin-yasgui": patch
---

Resolve the YASGUI assets without a trailing slash, to stop Node from printing a
deprecation warning on every startup:

```
[DEP0155] DeprecationWarning: Use of deprecated trailing slash pattern mapping
"./build/" in the "exports" field module resolution of the package at
@zazuko/yasgui/package.json
```

The specifier ended with a slash, which Node resolves through the deprecated
trailing slash pattern mapping of the `exports` field. `@zazuko/yasgui` itself
uses the modern `"./*"` subpath pattern, so only the specifier had to change.

The resolved directory, and therefore the files being served, are unchanged.
