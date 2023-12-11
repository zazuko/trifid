# Markdown support for Trifid

You can use this plugin to serve markdown files as content for Trifid.

This works well in case you have a lot of Markdown files and want to generates HTML pages out of them.

It supports the following features:

- multilangual content
- default language fallback
- custom templates
- multiple namespaces

A namespace in that regard is a dedicated instance of that plugin.
A single Trifid instance can host multiple namespaces.

## Quick start

Install this Trifid plugin using:

```sh
npm install @zazuko/trifid-markdown-content
```

And then add in the `config.yaml` file the following part:

```yaml
middlewares:
  # […] your other middlewares
  spex:
    module: "@zazuko/trifid-markdown-content"
    order: 80
    config:
      directory: file:content/custom
      mountPath: /content/
      namespace: custom-content
```

This will create a new `custom-content` namespace that will serve the content located in the `content/custom` directory.
The content will be available with the `/content/` prefix.

## Configuration

The following options are supported:

- `directory`: The directory where the content is located. This should be a local directory (required).
- `mountPath`: The path where the content should be mounted. This should be a path that is not used by other middlewares (required).
- `namespace`: The namespace of the content. This is used to separate the content from other namespaces (default: `default`).
- `idPrefix`: The prefix to use for the generated IDs for headings (default: `markdown-content-`).
- `classes`: The classes to add to the generated HTML (default: `{}`). Keys should be the CSS selectors, values should be the classes to add.
- `autoLink`: If `true`, will automatically add links to headings (default: `true`).
- `template`: Path to an alternative template (default: `views/content.hbs`).

## Content

The content is expected to be in Markdown format.
It should be stored in the configured directory.
Each file should be in a dedicated directory.
Each directory can contains multiple files:

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

First create a `content` directory.
Then create a `about` directory inside the `content` directory.
Inside the `about` directory, move the `about.md` file and rename it to `default.md`.

Then create a `contact` directory inside the `content` directory.
Inside the `contact` directory, move the `contact.md` file and rename it to `default.md`.

If you want to create the pages directly at the root of your Trifid instance, you can use the following Plugin configuration:

```yaml
middlewares:
  # […] your other middlewares
  spex:
    module: "@zazuko/trifid-markdown-content"
    order: 80
    config:
      directory: file:content
      mountPath: /
      namespace: root-content
```

That way, you will have two new endpoints:

- `/about`: will display the content of `content/about/default.md`
- `/contact`: will display the content of `content/contact/default.md`

If you want to support multiple languages, you can create a `XX.md` file in each directory, by replacing `XX` by the language code, like `en`, `fr`, `de`, `it`, …

If you don't want to use a default language, you can remove the `default.md` file.
It will serve an empty content instead.
