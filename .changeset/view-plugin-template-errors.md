---
"trifid-core": patch
---

Report an unusable template file in the `view` plugin instead of failing on the
first request.

The template is only read when a request comes in, so a `path` pointing at a
file that does not exist, cannot be read, or is not a file at all stayed
unnoticed until the route was hit and answered with a 500. Those cases are now
reported as an error when the instance starts:

```
ERROR (welcome): the template file '/srv/trifid/welcome.hbs' does not exist
ERROR (welcome): the template file '/srv/trifid/welcome.hbs' cannot be read (permission denied)
ERROR (welcome): the template path '/srv/trifid/views' is not a file
```

A missing `path` field is now logged as well, in addition to the error that was
already thrown.
