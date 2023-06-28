# trifid-plugin-yasgui

YASGUI for Trifid.
This middleware does the static file hosting for all YASGUI files and renders an index page that points to the given endpoint URL.

## Quick start

Install this Trifid plugin using:

```sh
npm install trifid-plugin-yasgui
```

And then add in the `config.yaml` file the following part:

```yaml
middlewares:
  # […] your other middlewares
  yasgui:
    module: trifid-plugin-yasgui
    paths: /sparql
    config:
      endpointUrl: https://example.com/query
      urlShortener: https://example.com/api/v1/shorten
      # …other configuration fields
```

## Configuration

The following options are supported:

- `endpointUrl`: URL to the SPARQL endpoint which will be used in the YASGUI interface. If a path is given instead of a URL, it will be resolved using the absolute URL (default value: `/query`)
- `urlShortener`: URL of an URL Shortener service. It will be called like this (assuming `urlShortener` is `https://example.com/api/v1/shorten`): `https://example.com/api/v1/shorten?url=url-to-your-query` and should return a short URL as plain text (`https://example.com/s/x8Z1a`). If `urlShortener` is not defined, the short URL feature will be disabled in YASGUI.
- `template`: Path to an alternative template (default: `views/yasgui.hbs`)
