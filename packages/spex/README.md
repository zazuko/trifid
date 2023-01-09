# trifid-plugin-spex

[SPEX](https://github.com/zazuko/spex) for Trifid.

This middleware does the static file hosting for all SPEX files and renders a view page that points to the configured endpoint URL.

## Quick start

Install this Trifid plugin using:

```sh
npm install trifid-plugin-spex
```

And then add in the `config.yaml` file the following part:

```yaml
middlewares:
  # […] your other middlewares
  spex:
    module: trifid-plugin-spex
    paths: /spex
    config:
      prefixes:
        - prefix: ex
          url: http://example.org/
```

## Configuration

The following options are supported (all of them optional):

- `url`: URL to the SPARQL endpoint which will be used in the SPEX interface
- `user`: User to connect to the SPARQL endpoint
- `password`: Password to connect to the SPARQL endpoint
- `graph`: Default graph to display
- `prefixes`: List of custom prefixes (e.g. `[{ prefix: 'ex', url: 'http://example.org' }]`)
