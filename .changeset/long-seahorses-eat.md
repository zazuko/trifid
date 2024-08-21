---
"trifid-core": major
---

Support for compression by default.

This change is considered as a breaking change as the `routeHandler` now needs to return the `reply` object in order to be compatible with the support for compression. This is necessary to allow the server to handle the compression of the response.

Before migrating, make sure to update your custom plugins and upgrade all plugins to the latest version.
