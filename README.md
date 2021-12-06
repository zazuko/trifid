# Zazuko Trifid - Lightweight Linked Data Server and Proxy
<img src="https://cdn.rawgit.com/zazuko/trifid/master/logo.svg" width="140px" height="140px" align="right" alt="Trifid-ld Logo"/>

[![Join the chat at https://gitter.im/zazuko/trifid](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/zazuko/trifid?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Trifid provides a lightweight and easy way to access Linked Data URIs via HTTP.
In the Linked Data world this is often called [dereferencing](http://en.wikipedia.org/wiki/Dereferenceable_Uniform_Resource_Identifier).
Trifid is inspired by [Pubby](https://www.w3.org/2001/sw/wiki/Pubby) and written in (server side) JavaScript.

### Features

* Provides a Linked Data interface to SPARQL protocol servers
* Provides a file based interface for testing
* Provides a customizable HTML renderer with embedded RDF
* Takes care of content-negotiation
* Provides a SPARQL proxy and [YASGUI](http://about.yasgui.org/) as web frontend

### Requirements

* A SPARQL endpoint
* Or for development some triples in a local file.

Trifid supports all content-types provided by the SPARQL endpoint and does not do additional format conversion.

### Trifid in the wild

Trifid can be completely themed according to your needs. Example resources using Trifid:

* Default view: http://lod.opentransportdata.swiss/didok/8500011
* Customized for one gov entity in Switzerland: https://ld.geo.admin.ch/boundaries/municipality/296

## Installation

Trifid is a [Node.js](http://nodejs.org/) based application.
To install and run it you will need to install [Node.js](http://nodejs.org/) on your system.

Clone the Github repository and run

    npm install

to install all module dependencies.

## Usage

To start the server execute the following command:

    npm start

The server script is also a command line program which can be called like this:

    trifid --config=my-trifid-config.json

If you want to run Trifid using a SPARQL endpoint and default settings, you can run it even without a config file:

    trifid --sparql-endpoint-url=http://localhost:3030/sparql     

### Parameters

The following parameters are available:

- `-v` or `--verbose`: Verbose output, will show the actual config after expanding
- `-c` or `--config`: Expects a path to a config as value, which will be used by Trifid
- `-p` or `--port`: Expects a port number as value, which will be used by the HTTP listener of Trifid
- `--sparql-endpoint-url`: Expects a SPARQL HTTP query interface URL value, which will be used by the Trifid SPARQL handler
- `--dataset-base-url`: Expects a Base URL value, which will be used to translate the request URLs

## Configuration

Trifid uses JSON configuration files and supports comments in JavaScript style.
One configuration file can use another file as base.
The `baseConfig` property must point to the other file.
Values of the base file will be overwritten.

### Examples

#### Default configuration

The default configuration `config.json` uses the file system handler and a [sample dataset](https://github.com/zazukoians/tbbt-ld) with characters from _The Big Bang Theory_.
The following command will run it:

    npm start

You will then be able to access its content, e.g. <http://localhost:8080/data/person/amy-farrah-fowler>.

In a production environment the SPARQL handler may be the better choice.

#### SPARQL configuration

For production systems we recommend data access via the [SPARQL 1.1 Protocol](http://www.w3.org/TR/sparql11-protocol/) interface.
`config-sparql.json` can be used as base configuration.
The following lines defines a configuration using a Fuseki SPARQL endpoint:

```JSON
{
  "baseConfig": "trifid:config-sparql.json",
  "sparqlEndpointUrl": "http://localhost:3030/dataset/sparql"
}
```

The `baseConfig` property defines which file should be used as base configuration.
The `trifid:` prefix prepends the Trifid module path.
The value of the `sparqlEndpointUrl` property is used in the handler and also the SPARQL proxy.

Sometimes SPARQL endpoints are running on TLS/SSL but provide an incomplete configuration or a self-signed certificate. In that case one can disable strict certificate checking by setting the environment variable `NODE_TLS_REJECT_UNAUTHORIZED`. For example:

    $ export NODE_TLS_REJECT_UNAUTHORIZED=0

### Properties

Usually only the following properties must be configured:

- `baseConfig`: Base configuration file for the current configuration file.
- `sparqlEndpointUrl`: URL of the SPARQL HTTP query interface.
- `datasetBaseUrl`: If the dataset is stored with a different base URL this property is used to translate the request URL.

The following properties are already defined in the default configurations:

- `listener`: `port` and `host` of the listener.
- `express`: Express settings as key vale pairs.
- `patchHeaders`: Settings for the `patch-headers` middleware.
- `mediaTypeUrl`: Settings for the `format-to-accept` middleware.
- `rewrite`: Settings for the camouflage-rewrite middleware.
- `handler`: Settings for the graph handler.

### Prefixes

It is possible to use prefixes in the property values of the configuration.
These prefixes will be translated to specific paths or environment variable values.

- `cwd`: Prepends the current working directory to the value.
- `env`: Uses the value of the environment variable with the name matching the value after the prefix.
  (e.g. `"env:SPARQL_ENDPOINT_URL"` will be replaced with the environment variable value of `$SPARQL_ENDPOINT_URL`)
- `trifid`: Prepends the Trifid module path to the value.

### Multiple Configurations

Most plugins support multiple configurations to support path or hostname specific configurations.
These plugins have an additional level in the config with the config name as key and the actual configuration as value.
Each config can have a `path` property.
If it's not defined, `/` will be used.
Also a `hostname` can be specified to use the config only for matching host names.
The `priority` may be required if multiple configs could match to an URL.

Example:
```JSON
"pluginName": {
  "root": {
    // "path": "/" will be automatically added if path is not given
    "priority": 200
    ...
  },
  "otherPath": {
    "path": "/other/",
    "priority": 100
    ...
  },
  "otherHostname": {
    "hostname": "example.org"
    "priority": 150
  }
}
```

### Static Files

With the `staticFiles` property, folders can be mapped into URL paths for static file hosting.
This plugin supports multiple configurations.
The key for a static file hosting can be used to replace values defined in a configuration, which is used as `baseConfig`.
If the first folder does not contain the requested file, the next folder will be used and so on.
The `folder` property points to the folder in the file system.
It's possible to use prefixes in the folder value.

Example:

```JSON
"staticFiles": {
  "rendererFiles": {
    "hostname": "example.org",
    "path": "/",
    "folder": "renderer:public"
  }
}
```

### Handler

The handler plugin supports multiple configurations.
Properties for the handler configuration:

- `module`: The handler JS file or module.
- `options`: Handler specific options.

More details about the handler specific options can be found in the documentation of the handlers:

- [Fetch files](https://github.com/zazukoians/trifid-handler-fetch)
- [SPARQL](https://github.com/zazukoians/trifid-handler-sparql)

### SPARQL Proxy

The SPARQL proxy plugin supports multiple configurations.
Properties:

- `options`: Options for the SPARQL proxy.

Options:

- `endpointUrl`: URL to the SPARQL HTTP query interface. (default: sparqlEndpointUrl)
- `authentication`: `user` and `password` for basic authentication.

See `config-virtuoso.json` and `config-stardog.json` for default configuration in case you use either of these stores.

Note that SPARQL is currently not supported by the in-memory store.

### Patch Headers

The patch headers plugin supports multiple configurations.
See the [patch-headers](https://www.npmjs.com/package/patch-headers) module documentation for more details.

### Rewrite

The rewrite plugin supports multiple configurations.
See the [camouflage-rewrite](https://www.npmjs.com/package/camouflage-rewrite) module documentation for more details.

Note that this module does _not_ work for most content-types, see the documentation for details. By default it should work for HTML and Turtle. It is merely for testing purposes and should not be active on production.

## Production Best Practices

Note that it is not recommended to run Node applications on [well-known ports](http://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers#Well-known_ports) (< 1024). You should use a reverse proxy instead.

### Installing/Using with Docker

Trifid can be installed using Docker. With this method you only need to have Docker installed, see https://docs.docker.com/installation/ for installation instructions for your platform.

Once Docker is installed clone the Github repository and run

    docker build -t trifid .

This creates an image named `trifid` that you can execute with

    docker run -ti -p 8080:8080 trifid

Once it is started you can access for example http://localhost:8080/data/person/sheldon-cooper . An example on using Docker can be found at [lod.opentransportdata.swiss](https://github.com/zazuko/lod.opentransportdata.swiss).

#### Trifid environment variables

You can change its behavior by changing the following environment variable:

    TRIFID_CONFIG config-sparql.json

This overrides the default configuration `config.json`.

#### Use the pre built image

If you do not want to build your own Docker image, you can pull the official image from [Docker Hub](https://hub.docker.com/r/zazuko/trifid/):

    docker pull zazuko/trifid


### Reverse Proxy

If you run Trifid behind a reverse proxy, the proxy must set the `X-Forwarded-Host` header field.

## Debugging

This package uses [`debug`](https://www.npmjs.com/package/debug), you can get debug logging via: `DEBUG=trifid:`.
Trifid plugins should also implement `debug` under the `trifid:` prefix, enabling logging from all packages
implementing it can be done this way: `DEBUG=trifid:*`.

## Support

Issues & feature requests should be reported on Github.

Pull requests are very welcome.

## License

Copyright 2015-2019 Zazuko GmbH

Trifid is licensed under the Apache License, Version 2.0. Please see LICENSE and NOTICE for details.
