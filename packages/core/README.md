# Trifid-LD - Lightweight Linked Data Server and Proxy
<img src="https://cdn.rawgit.com/zazukoians/trifid-ld/master/logo.svg" width="140px" height="140px" align="right" alt="Trifid-ld Logo"/>

[![Join the chat at https://gitter.im/zazukoians/trifid-ld](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/zazukoians/trifid-ld?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Trifid-LD provides a lightweight and easy way to access Linked Data URIs via HTTP.
In the Linked Data world this is often called [dereferencing](http://en.wikipedia.org/wiki/Dereferenceable_Uniform_Resource_Identifier).
Trifid-LD is inspired by [Pubby](http://wifo5-03.informatik.uni-mannheim.de/pubby/) and written in (server side) JavaScript.

Features:

* Provides a Linked Data interface to SPARQL protocol servers
* Provides an in-memory store suitable for smaller data sets and testing environments
* Provides a simple HTML interface showing the data available about each resource
* Support for multiple HTML templates based on namespace patterns
* HTML view is providing embedded JSON-LD, which is rendered by client-side JavaScript
* Takes care of content-negotiation
* Runs well behind HTTP reverse proxies like Varnish
* Provides a SPARQL proxy and [YASGUI](http://about.yasgui.org/) as web frontend
* Does not do 303 redirects because we don't like the extra round-trip
* Official [Docker container](https://hub.docker.com/r/zazukoians/trifid-ld/) available (Example use see [lod.opentransportdata.swiss](https://github.com/zazuko/lod.opentransportdata.swiss))

Requirements:

* A SPARQL endpoint (accessed via HTTP, needs to support JSON-LD for HTML view)
* Or for development some triples in a local file. In this case the built-in in-memory store can be used.

Trifid-LD supports all content-types provided by the SPARQL endpoint and does not do additional format conversion.

## Installation

Trifid-LD is a [Node.js](http://nodejs.org/) based application.
To install and run it you will need to install [Node.js](http://nodejs.org/) on your system.
You can also use our official [Docker container](https://hub.docker.com/r/zazukoians/trifid-ld/).
See for example [lod.opentransportdata.swiss](https://github.com/zazuko/lod.opentransportdata.swiss)) about how to use this.

### Installing with Node.js

Make sure you have [Node.js](http://nodejs.org/)installed. Once this is done clone the Github repository and run 

    npm install
    

to install all module dependencies.

Trifid-LD is using Bunyan for logging. To pretty print log output on the console you might want to install it globally using

    npm install -g bunyan

To start the server execute

    npm start | bunyan


Note that it is not recommended to run Node applications on [well-known ports](http://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers#Well-known_ports) (< 1024).
You should use a reverse proxy like [Varnish](https://www.varnish-cache.org/) instead.

### Installing/Using with Docker

To use Trifid-LD with this method you only need to have Docker installed, see https://docs.docker.com/installation/ for installation intructions for your platform.

Once Docker is inatlled clone the Github repository and run

    docker build -t trifid .
    
This creates an image named `trifid` that you can execute with

    docker run -p 8080:8080 trifid 

Once it is started you can access for example http://localhost:8080/data/person/sheldon-cooper.

## Configuration

Trifid uses JSON configuration files and supports comments in JavaScript style.
One configuration file can use another file as base.
The `baseConfig` property must point to the other file.
Values of the base file will be overwritten.

### Examples

#### Default configuration

The default configuration `config.json` uses the file system handler and a [sample dataset](https://github.com/zazukoians/tbbt-ld) with characters from _The Big Bang Theory_.
The following command will run it:

    npm run

In a production environment the SPARQL handler may be the better choise.

#### SPARQL configuration

For production systems we recommend data access via the [SPARQL 1.1 Protocol](http://www.w3.org/TR/sparql11-protocol/) interface.
`config.fuseki.json` can be used as base configuration.
The following lines defines a configuration using a Fuseki SPARQL endpoint:

```
{
  "baseConfig": "trifid:config.fuseki.json",
  "sparqlEndpointUrl": "http://localhost:3030/dataset/sparql"
}
```

The `baseConfig` property defines which file should be used as base configuration.
The `trifid:` prefix prepends the Trifid module path.
The value of the `sparqlEndpointUrl` property is used in the handler and also the SPARQL proxy.

### Properties

Usually only the following properties must be configured:

- `baseConfig`: Base configuration file for the current configuration file.
- `sparqlEndpointUrl`: URL of the SPARQL HTTP query interface.
- `datasetBaseUrl`: If the dataset is stored with a different base URL this property is used to translate the request URL.

The following properties are already defined in the default configurations and must usually not be touched:

- `logger`: Settings for the `bunyan` logger.
- `listener`: `port` and `host` of the listener.
- `express`: Express settings as key vale pairs.
- `patchHeaders`: Settings for the `patch-headers` middleware.
- `rewrite`: Settings for the camouflage-rewrite middleware.
- `handler`: Settings for the graph handler.

### Prefixes

It's possible to use prefixes for specific paths in the property values.

- `cwd`: Prepends the current working directory to the value.
- `trifid`: Prepends the Trifid module path to the value.

### Handler

Properties for the handler configuration:

- `module`: The handler JS file or module.
- `options`: Handler specific options.

#### File System

Option supported by the file system handler:

- `path`: Path to the graph files in Turtle/N-Triples format.

#### SPARQL

The SPARQL handler runs an ASK query to check if the requested resource exists.
If the resource exists a DESCRIBE or CONSTRUCT query is used to fetch the triples. 
The following options are supported:

- `endpointUrl`: URL to the SPARQL HTTP query interface. (default: sparqlEndpointUrl)
- `existsQuery`: Query template to test if the resource exits.
- `graphQuery`: Query template to fetch the triples.

`${iri}` in the query templates string will be replaced by the requested URL.

### SPARQL Proxy

Properties:

- `path`: The URL path where the SPARQL proxy will be mounted.
- `options`: Options for the SPARQL proxy.

Options:

- `endpointUrl`: URL to the SPARQL HTTP query interface. (default: sparqlEndpointUrl)
- `authentication`: `user` and `password` for basic authentication.

Note that SPARQL is currently not supported by the in-memory store.

### Patch Headers

See the [patch-headers](https://www.npmjs.com/package/patch-headers) module documentation for more details.

### Rewrite

See the [camouflage-rewrite](https://www.npmjs.com/package/camouflage-rewrite) module documentation for more details.

## Usage

### Reverse Proxy

If you run Trifid-LD behind a reverse proxy, the proxy must set the `X-Forwarded-Host` header field.

## Support

Issues & feature requests should be reported on Github.

Pull requests are very welcome.

## HTTPRange-14 or Ceci n'est pas une pipe

Trifid-LD does not care about [HTTPRange-14](http://en.wikipedia.org/wiki/HTTPRange-14) and neither should you.
We consider the extra 303 redirect round-trip a waste of precious response time.
You get back what you asked for in content-negotiation.

![Ceci n'est pas une pipe](http://upload.wikimedia.org/wikipedia/en/thumb/b/b9/MagrittePipe.jpg/300px-MagrittePipe.jpg)

We are aware that the [URI and the representation](http://en.wikipedia.org/wiki/The_Treachery_of_Images) are not the same thing but if we ever have to care about it, we would implement it using the [Content-Location](http://tools.ietf.org/html/rfc7231#section-3.1.4.2) header field.

## License

Copyright 2015-2016 Zazuko GmbH

Trifid-LD is licensed under the Apache License, Version 2.0. Please see LICENSE and NOTICE for details.
