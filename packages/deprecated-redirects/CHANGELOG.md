# @zazuko/trifid-handle-redirects

## 0.1.3

### Patch Changes

- 56ce444: Fix redirections, added support for `<http://www.w3.org/2006/http#2006>`.
  It was already supporting `<http://www.w3.org/2006/http#2011>` and has priority over 2006.

  **Known issue:** it does not work for rewritten URL.

  Closes #179.

- 2c64bc9: Remove useless files
