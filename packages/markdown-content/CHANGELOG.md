# @zazuko/trifid-markdown-content

## 2.0.4

### Patch Changes

- 080f5d8: Harmonize author and keywords fields
- a97a6a0: Use Apache 2.0 license

## 2.0.3

### Patch Changes

- 1cafa55: Return `reply` in the `routeHandler`, in order to be compatible with the support for compression.

## 2.0.2

### Patch Changes

- e816fd3: Add support for trailing slashes (and redirect to it, to avoid duplicate content issues)
- e8faa76: Internally use the new `render` function, that takes the `request` as first argument.
- 71dc4ee: Use session to store content

## 2.0.1

### Patch Changes

- 777bc01: Force the `text/html` content-type

## 2.0.0

### Major Changes

- 0281f85: The plugin is now using the new Trifid factory, which is a breaking change.
- 4b515f8: Use 'plugins' instead of 'middlewares'

### Patch Changes

- 69d6ad0: Improve included TypeScript types.

## 1.0.1

### Patch Changes

- 20681d2: Change default value for `idPrefix` from `markdown-content-` to `content-`.

## 1.0.0

### Major Changes

- 7090728: **BREAKING CHANGE:**
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

## 0.2.0

### Minor Changes

- b45cc1b: Configure idPrefix and classes.
- 2b308df: Custom templates can be used using `template` configuration option
- b703951: Add support for `autoLink` configuration.
  If set to `true`, which is the default value, this will add links to headings.

### Patch Changes

- 7babef1: Use 'markdown-content-' as id prefix, instead of 'content-'.

## 0.1.0

### Minor Changes

- ab6fae4: Initial release.
