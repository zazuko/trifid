# IIIF plugin for Trifid

> [!IMPORTANT]
> This plugin is not used anymore and some things might be broken.
> If you have a specific use case for this plugin, please open an issue.

A trifid plugin to provide data about image and audio/visual files.

It provides data using the [schema](https://iiif.io/api/presentation/3/context.json) defined by the [International Image Interoperability Framework](https://iiif.io)

## Installation

To install the plugin, run:

```sh
npm install @zazuko/trifid-plugin-iiif
```

## Configuration

This is how you can configure the plugin:

```yaml
plugins:
  # […] your other plugins
  iiif:
    module: "@zazuko/trifid-plugin-iiif"
    paths:
      - /iiif/
    config:
      uriPrefix: https://website
      endpointUrl: https://website/query
      endpointUser: optional
      endpointPassword: optional
```

Then, http://localhost:8080/data/1 will use the URI: <https://website/data/1> to fetch all the related data from the https://website/query SPARQL endpoint.

If no `uriPrefix` is given, the plugin will accept a `uri` query parameter.
