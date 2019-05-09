# trifid-core
<img src="https://cdn.rawgit.com/zazuko/trifid/master/logo.svg" width="140px" height="140px" align="right" alt="Trifid-ld Logo"/>

[![Join the chat at https://gitter.im/zazuko/trifid](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/zazuko/trifid?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Just the core parts of Trifid (plugin loader, config handler, ...).
This package doesn't contain any handlers (SPARQL, file system, ...).
If you want a out of the box solution check [trifid](https://www.npmjs.com/package/trifid/).

## Debugging / Logging Output

This package uses [`debug`](https://www.npmjs.com/package/debug) under the `trifid:core` namespace.

Debugging information is printed when the string `trifid:core` or `trifid:*` is present in the space or comma-separated `DEBUG` environment variable, for instance `DEBUG=http,trifid:*,somethingelse npm start` in a package depending on `trifid-core`.
