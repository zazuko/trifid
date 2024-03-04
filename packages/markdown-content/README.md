# Markdown support for Trifid

You can use this plugin to serve Markdown files as content for Trifid.

This works well in case you have a lot of Markdown files and want to generate HTML pages out of them.

It supports the following features:

- multilingual content
- default language fallback
- custom templates
- multiple namespaces

A namespace in that regard is a dedicated set of content to serve.
A single Trifid instance can host multiple namespaces, and each of them can be configured in an independent way.

## Quick start

Install this Trifid plugin using:

```sh
npm install @zazuko/trifid-markdown-content
```

And then add in the `config.yaml` file the following part:

```yaml
plugins:
  # […] your other plugins
  markdown-content:
    module: "@zazuko/trifid-markdown-content"
    order: 80
    config:
      defaults:
        autoLink: true
      entries:
        custom-content:
          directory: file:content/custom
          mountPath: /content/
```

This will create a new `custom-content` namespace that will serve the content located in the `content/custom` directory.
The content will be available with the `/content/` prefix.

## Configuration

The following options are supported:

- `entries`: The list of namespaces to create. Keys should be the namespace names, and values should be the configuration for the namespace (required).
- `defaults`: The default configuration for all namespaces (optional). This is useful if you want to have the same configuration for all namespaces. You can still override the configuration for a specific namespace.

### Namespace options

You can define them in the `defaults` section or in specific entries in the `entries` section.
Those options are all optional.

- `idPrefix`: The prefix to use for the generated IDs for headings (default: `content-`).
- `classes`: The classes to add to the generated HTML (default: `{}`). Keys should be the CSS selectors, and values should be the classes to add.
- `autoLink`: If `true`, will automatically add links to headings (default: `true`).
- `template`: Path to an alternative template (default: `views/content.hbs`).

### Namespace configuration

The following options are required for each namespace:

- `directory`: The directory where the content is located. This should be a local directory (required).
- `mountPath`: The path where the content should be mounted. This should be a path that is not used by other plugins (required).

### Example

This is a more complete example on how this plugin can be used:

```yaml
plugins:
  # […] your other plugins
  markdown-content:
    module: "@zazuko/trifid-markdown-content"
    order: 80
    config:
      defaults:
        idPrefix: content-
        classes:
          h1: custom-h1
          h2: custom-h2
          h3: custom-h3
          h4: custom-h4
          h5: custom-h5
          h6: custom-h6
        autoLink: true
        template: file:views/content.hbs
      entries:
        root-content:
          directory: file:content/root
          mountPath: /
        about-content:
          directory: file:content/about
          mountPath: /about/
          autoLink: false # override the default value
```

## Content

The content is expected to be in Markdown format.
It should be stored in the configured directory.
Each file should be in a dedicated directory.
Each directory can contain multiple files:

- `en.md`: The content in English
- `fr.md`: The content in French
- `de.md`: The content in German
- `it.md`: The content in Italian
- the same for any other languages…
- `default.md`: The default content in case the language used by the user is not available as a dedicated file

If the `default.md` file is not present, the content will be empty in case the language used by the user is not available as a dedicated file.
A good practice is to always have a `default.md` file.

Let's take an example.
Imagine you want to serve the two following Markdown files:

- `about.md`
- `contact.md`

First, create a `content` directory.
Then create a `about` directory inside the `content` directory.
Inside the `about` directory, move the `about.md` file and rename it to `default.md`.

Then create a `contact` directory inside the `content` directory.
Inside the `contact` directory, move the `contact.md` file and rename it to `default.md`.

If you want to create the pages directly at the root of your Trifid instance, you can use the following Plugin configuration:

```yaml
plugins:
  # […] your other plugins
  markdown-content:
    module: "@zazuko/trifid-markdown-content"
    order: 80
    config:
      entries:
        root-content:
          directory: file:content
          mountPath: /
```

That way, you will have two new endpoints:

- `/about`: will display the content of `content/about/default.md`
- `/contact`: will display the content of `content/contact/default.md`

If you want to support multiple languages, you can create a `XX.md` file in each directory, by replacing `XX` by the language code, like `en`, `fr`, `de`, `it`, …

If you don't want to use a default language, you can remove the `default.md` file.
It will serve an empty content instead.
