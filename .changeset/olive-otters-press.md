---
"@zazuko/trifid-markdown-content": major
---

**BREAKING CHANGE:**
The plugin configuration changed in order to support multiple namespaces directly.

The following configuration:

```yaml
middlewares:
  # […] your other middlewares
  markdown-content:
    module: "@zazuko/trifid-markdown-content"
    order: 80
    config:
      namespace: root-content
      directory: file:content
      mountPath: /
```

Can be migrated in an easy way by moving all configuration entries (except the namespace) into the config.entries[namespaceValue] key, like this:

```yaml
middlewares:
  # […] your other middlewares
  markdown-content:
    module: "@zazuko/trifid-markdown-content"
    order: 80
    config:
      entries:
        root-content:
          directory: file:content
          mountPath: /
```

See more details and options in the `README.md` file of the plugin.
