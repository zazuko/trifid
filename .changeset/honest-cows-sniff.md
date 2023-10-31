---
"trifid-core": minor
---

Improve types in general.

`trifid.start` now returns a `Promise<import('http').Server>` instead of `void`.
This allows to wait for the server to be ready before doing anything else.
