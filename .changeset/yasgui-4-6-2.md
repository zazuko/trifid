---
"trifid-plugin-yasgui": patch
---

Update `@zazuko/yasgui` to `^4.6.2`.

This release bundles the 500 most popular prefixes from prefix.cc directly into the
library instead of calling the prefix.cc API at runtime, so the SPARQL editor no longer
makes a third-party network request to resolve prefixes. It also moves YASGUI's own
build from webpack to Vite; the served asset names (`yasgui.min.js`, `yasgui.min.css`)
are unchanged.
