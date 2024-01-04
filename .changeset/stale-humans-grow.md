---
"@zazuko/trifid-entity-renderer": patch
---

Remove `Content-Disposition` header from response from the SPARQL endpoint.
This header was triggering the download of the response as a file instead of displaying it in the browser.
This was affecting Blazegraph and RDF4J as reported by some users.

Thanks to @Tomvbe for providing the fix.
