---
"@zazuko/trifid-entity-renderer": patch
---

Upgrade `p-queue`, which schedules the label loader queries, from 9.3.5 to
10.0.0.

The label loader keeps behaving the same, but `p-queue` now validates its
options more strictly: `labelLoader.concurrency` must be a whole number, and
`labelLoader.timeout` cannot exceed `2147483647` milliseconds. A configuration
outside of these bounds used to be accepted and now makes the label loader
throw.
