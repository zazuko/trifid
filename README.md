# Trifid

<img src="https://cdn.rawgit.com/zazuko/trifid/master/logo.svg" width="140px" height="140px" align="right" alt="Trifid-ld Logo"/>

## What is Trifid?

It's a Web server specialized in Linked Data.

The main functionalities of Trifid are:

### Dereference Linked data entities

Providing different serializations using content-negotiation of entities in a file or queried using a SPARQL endpoint.
The serializations include HTML rendering based on customizable templates.

### Using a SPARQL endpoint

If a SPARQL endpoint is the source of the RDF data, some additional plugins are enabled by default.

- [SPARQL Proxy](./packages/sparql-proxy/): Public access to the configured store.
- [YASGUI](./packages/yasgui/): UI to write, execute, and analyze SPARQL queries.
- [Graph Explorer](./packages/graph-explorer/): UI to explore the data in a graph view
- [SPEX](./packages/spex/): Introspects the data on the endpoint and shows the data model

### Further use

This server can also be extended with plugins, depending on the use case of the deployment.

#### Examples

- [CKAN harvester endpoint](./packages/ckan/)
- [IIIF Trifid plugin](./packages/iiif/)

## Who Uses Trifid?

Trifid is open source and meant to work out of the box for data publishers.
Most users will use only the main features.
We, or people that dive deeper into the code, maintain and develop instances with additional plugins.

### Installations

Example resources using Trifid:

- Default view: http://lod.opentransportdata.swiss/didok/8500011
- Customized for one gov entity in Switzerland: https://ld.geo.admin.ch/boundaries/municipality/296

## Trifid objectives

The main [trifid](https://github.com/zazuko/trifid) package provides some default plugins:

- Handlers to read RDF data from the file system and SPARQL endpoints
- The [handlebars](https://handlebarsjs.com/) template engine
- A HTML renderer for the RDF data
- The plugins mentioned [here](#using-a-sparql-endpoint)

## Documentation

- See the [configuration](https://github.com/zazuko/trifid/wiki/Configuration) wiki page for more details on the configuration system.
- See the [customize-the-templates](https://github.com/zazuko/trifid/wiki/Customize-the-templates) wiki page for more details on the template system.

## Trifid Core

Trifid Core contains the HTTP server component and a configuration system to load plugins.
Usually, it's not required to use the Trifid Core package.
The main [trifid](https://github.com/zazuko/trifid) package provides an opinionated setup that works for most use cases.

## Installation

Trifid is a [Node.js](http://nodejs.org/)-based application.
To install and run it, you will need to install [Node.js](http://nodejs.org/) on your system.

Install the npm package:

```sh
npm install -g trifid
```

## Usage

To start the server, execute the following command:

```sh
npx trifid
```

If you want to run Trifid using a SPARQL endpoint and default settings, you can run it even without a config file:

```sh
trifid --sparql-endpoint-url=http://localhost:3030/sparql
```

### Parameters

The following parameters are available:

- `-c` or `--config`: Expects a path to a config as value, which will be used by Trifid
- `-p` or `--port`: Expects a port number as value, which will be used by the HTTP listener of Trifid
- `--sparql-endpoint-url`: Expects a SPARQL HTTP query interface URL value, which will be used by the Trifid SPARQL handler
- `--dataset-base-url`: Expects a Base URL value, which will be used to translate the request URLs

## Configuration

Trifid uses YAML or JSON configuration files.
One configuration file can use another file as base.
The `extends` property must point to the other file.
Values of the base file will be overwritten.

### Examples

#### Big Bang Theory dataset

If you use [`instances/tbbt/config.yaml`](./packages/trifid/instances/tbbt/config.yaml) as a base configuration, you will get a server that serves the [Big Bang Theory dataset](https://github.com/zazuko/tbbt-ld).

It will load the triples from the following remote file: https://raw.githubusercontent.com/zazuko/tbbt-ld/master/dist/tbbt.nt.

You will then be able to access its content, e.g. [Amy Farrah Fowler](http://localhost:8080/data/person/amy-farrah-fowler).

This is a good starting point to understand how dereferencing works.

#### SPARQL configuration

For production systems, we recommend data access via the [SPARQL 1.1 Protocol](http://www.w3.org/TR/sparql11-protocol/) interface.
[`instances/docker-sparql/config.yaml`](./packages/trifid/instances/docker-sparql/config.yaml) can be used as base configuration.

##### SPARQL endpoint with self-signed certificate

Sometimes SPARQL endpoints are running on TLS/SSL but provide an incomplete configuration or a self-signed certificate.
In that case, one can disable strict certificate checking by setting the environment variable `NODE_TLS_REJECT_UNAUTHORIZED`.

For example:

```sh
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

## Production Best Practices

Note that it is not recommended to run Node applications on [well-known ports](http://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers#Well-known_ports) (< 1024).
You should use a reverse proxy instead.

### Using with Docker

Trifid can be installed using Docker.
With this method, you only need to have Docker installed.
See https://docs.docker.com/installation/ for installation instructions for your platform.

```sh
docker run --rm -it -p 8080:8080 ghcr.io/zazuko/trifid
```

#### Trifid environment variables

You can use the following environment variables:

- `TRIFID_CONFIG`: the configuration file to use (default value: [`instances/docker-sparql/config.yaml`](./packages/trifid/instances/docker-sparql/config.yaml), which enable the following environment variables)
- `SPARQL_ENDPOINT_URL`: the SPARQL endpoint URL to use
- `DATASET_BASE_URL`: the base URL to use to enable rewriting
- `SPARQL_ENDPOINT_USERNAME`: the user to use to authenticate against the SPARQL endpoint
- `SPARQL_ENDPOINT_PASSWORD`: the password to use to authenticate against the SPARQL endpoint

If you want to use a file that contains your triples instead of a SPARQL endpoint, you can set `TRIFID_CONFIG` to [`instances/docker-fetch/config.yaml`](./packages/trifid/instances/docker-fetch/config.yaml), and you will be able to use the following environment variables to configure your instance:

- `FETCH_HANDLER_FILE`: the file to use to fetch the data (default value: `https://raw.githubusercontent.com/zazuko/tbbt-ld/master/dist/tbbt.nt`)
- `FETCH_HANDLER_FILE_TYPE`: the type of the file to use to fetch the data (default value: `application/n-triples`)
- `DATASET_BASE_URL`: the base URL to use to enable rewriting

### Reverse Proxy

If you run Trifid behind a reverse proxy, the proxy must set the `X-Forwarded-Host` header field.

## Debugging

The log level can be configured by using the `server.logLevel` property.
Supported log levels are: `fatal`, `error`, `warn`, `info`, `debug`, `trace` and `silent`.

## Monorepo

To improve the maintenability of the whole project, we decided to use a monorepo architecture.

Here is the list of all packages that are maintained here:

| Package                                                          | Latest version                                                                                                              |                                   |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| [`trifid`](./packages/trifid)                                    | [![](https://badge.fury.io/js/trifid.svg)](https://npm.im/trifid)                                                           | Bundle with commonly used plugins |
| [`trifid-core`](./packages/core)                                 | [![](https://badge.fury.io/js/trifid-core.svg)](https://npm.im/trifid-core)                                                 | Core package                      |
| [`@zazuko/trifid-entity-renderer`](./packages/entity-renderer)   | [![](https://badge.fury.io/js/@zazuko%2Ftrifid-entity-renderer.svg)](https://npm.im/@zazuko/trifid-entity-renderer)         | Entity renderer                   |
| [`trifid-plugin-graph-explorer`](./packages/graph-explorer)      | [![](https://badge.fury.io/js/trifid-plugin-graph-explorer.svg)](https://npm.im/trifid-plugin-graph-explorer)               | Graph Explorer plugin             |
| [`@zazuko/trifid-plugin-ckan`](./packages/ckan)                  | [![](https://badge.fury.io/js/@zazuko%2Ftrifid-plugin-ckan.svg)](https://npm.im/@zazuko/trifid-plugin-ckan)                 | CKAN harvester endpoint           |
| [`trifid-handler-fetch`](./packages/handler-fetch)               | [![](https://badge.fury.io/js/trifid-handler-fetch.svg)](https://npm.im/trifid-handler-fetch)                               | Fetch handler for Trifid          |
| [`trifid-plugin-i18n`](./packages/i18n)                          | [![](https://badge.fury.io/js/trifid-plugin-i18n.svg)](https://npm.im/trifid-plugin-i18n)                                   | i18n support for Trifid           |
| [`@zazuko/trifid-markdown-content`](./packages/markdown-content) | [![](https://badge.fury.io/js/@zazuko%2Ftrifid-markdown-content.svg)](https://npm.im/@zazuko/trifid-markdown-content)       | Create pages from Markdown files  |
| [`@zazuko/trifid-plugin-sparql-proxy`](./packages/sparql-proxy)  | [![](https://badge.fury.io/js/@zazuko%2Ftrifid-plugin-sparql-proxy.svg)](https://npm.im/@zazuko/trifid-plugin-sparql-proxy) | Trifid plugin for SPARQL proxy    |
| [`trifid-plugin-spex`](./packages/spex)                          | [![](https://badge.fury.io/js/trifid-plugin-spex.svg)](https://npm.im/trifid-plugin-spex)                                   | SPEX plugin for Trifid            |
| [`trifid-plugin-yasgui`](./packages/yasgui)                      | [![](https://badge.fury.io/js/trifid-plugin-yasgui.svg)](https://npm.im/trifid-plugin-yasgui)                               | YASGUI plugin for Trifid          |

## Support

Issues & feature requests should be reported on [GitHub](https://github.com/zazuko/trifid).

Pull requests are very welcome.

## License

Copyright Zazuko GmbH.

Trifid is licensed under the [Apache License, Version 2.0](./LICENSE).
