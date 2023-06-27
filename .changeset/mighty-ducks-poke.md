---
"trifid": major
---

Use `@zazuko/trifid-entity-renderer` instead of `@zazuko/trifid-renderer-entity`

You will need to do the change in your configuration file:

```diff
 middlewares:
   # …

   entity-renderer:
-    module: "@zazuko/trifid-renderer-entity"
+    module: "@zazuko/trifid-entity-renderer"
```
