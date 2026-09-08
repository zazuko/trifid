---
"@zazuko/trifid-entity-renderer": minor
---

Bound the number of terms the label loader fetches labels for, through the new
`labelLoader.maxTerms` option (`1000` by default, `0` to disable the limit).

Labels are fetched in chunks, and the number of chunks was not bounded. An
entity describing a very large graph could therefore queue thousands of queries
against the SPARQL endpoint to render a single page: a resource resolving to
129'000 unlabelled IRIs queued more than 4'000 label queries, which kept hitting
the endpoint even after the request had already failed.

The terms are now capped, and the chunks that have not started yet are dropped
as soon as one of them fails, so a slow endpoint is no longer flooded with the
remaining queries. The chunks that did succeed are still used, instead of the
whole render failing.

When the limit is reached, a warning is logged and the remaining terms are
rendered with their IRI instead of a label.
