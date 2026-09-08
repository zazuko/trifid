---
"trifid": minor
"trifid-core": minor
---

Add support for serving an instance under a subpath.

Instances are served at the root of a domain by default. Deployments that only
have a subdomain, and already serve other things on it, can now mount Trifid
under a subpath instead:

```yaml
server:
  subpath: /SUBPATH
```

A resource whose IRI is `http://example.org/path/resource` is then served as
`https://example.com/SUBPATH/path/resource`. The subpath is applied to the
routes of every plugin, to the static files, to the templates, and to the IRI
rewriting, so links and content negotiation keep pointing at the right place.

Endpoint URLs configured as root-relative paths (such as `url: /query`) refer to
a route of the instance itself, so they now resolve under the subpath too and do
not need to be adjusted.

Templates receive the subpath as the `subpath` variable, which always ends with a
slash so that it can be interpolated directly:

```handlebars
<link rel="stylesheet" href="{{subpath}}static/core/style.css" />
```

Plugins receive it as `subpath` on their argument, and `normalizeSubpath` /
`joinSubpath` are exported to help them mount their own static files.

The default value is `/`, which is exactly the previous behaviour, so existing
configurations and plugins are unaffected.
