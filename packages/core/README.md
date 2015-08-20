# Trifid-LD - Lightweight Linked Data Server and Proxy

Trifid-LD provides a lightweight and easy way to access Linked Data URIs via HTTP. In the Linked Data world this is often called [dereferencing](http://en.wikipedia.org/wiki/Dereferenceable_Uniform_Resource_Identifier). Trifid-LD is inspired by [Pubby](http://wifo5-03.informatik.uni-mannheim.de/pubby/) and written in (server side) JavaScript.

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

Requirements:

* A SPARQL endpoint (accessed via HTTP, needs to support JSON-LD for HTML view)
* Or for development some triples in a local file. In this case the built-in in-memory store can be used.

Trifid-LD supports all content-types provided by the SPARQL endpoint and does not do additional format conversion.

## Installation

Trifid-LD is a [Node.js](http://nodejs.org/) based application. To install and run it you either have to have [Node.js](http://nodejs.org/) or [IO.js](https://iojs.org/) installed or you can use [Docker](https://www.docker.com/) an build a docker image containing Trifid-LD and all its dependencies.

### Installing with Node.js or IO.js

Make sure you have either [Node.js](http://nodejs.org/) or [IO.js](https://iojs.org/) installed. Once this is done clone the Github repository and run 

    npm install
    
to install all module dependencies.

Trifid-LD is using Bunyan for logging. To pretty print log output on the console you might want to install it globally using

    npm install -g bunyan

To start the server execute

    npm start | bunyan


Note that it is not recommended to run Node applications on [well-known ports](http://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers#Well-known_ports) (< 1024). You should use a reverse proxy like [Varnish](https://www.varnish-cache.org/) instead.

### Installing/Using with Docker

To use Trifid-LD with this method you only need to have Docker installed, see https://docs.docker.com/installation/ for installation intructions for your platform.

Once Docker is inatlled clone the Github repository and run

    docker build -t trifid .
    
This creates an image named `trifid` that you can execute with

    docker run -p 8080:8080 trifid 

Once it is started you can access for example http://localhost:8080/data/person/sheldon-cooper.

## Using it

Trifid-LD comes with two configurations

### Default configuration

The default configuration `config.js` uses the LDP module with an in memory store and a [sample dataset](https://github.com/zazukoians/tbbt-ld) with characters from _The Big Bang Theory_.

During the init process the graphs are splitted, which may take some time for bigger graphs. For development the LDP module is useful but it should be replaced by a SPARQL endpoint in production environments.

### Using a HTTP SPARQL endpoint

For production systems we recommend data access via the [SPARQL 1.1 Protocol](http://www.w3.org/TR/sparql11-protocol/) interface.

`config.sparql.js` is already prepared to work with the sample Fuseki configuration in `data/scripts/`. The folder contains scripts to run a Fuseki server with the same example data used in the LDP module configuration, adjust this according to your needs.

If you run Trifid-LD behind a reverse proxy, the proxy must set the `X-Forwarded-Host` and `X-Forwarded-Port` header fields. This constructed URI is used in the `SPARQL DESCRIBE` query which is also defined in the configuration. If you want to use another query you need to adjust the `buildQuery` method.

### SPARQL Proxy

The SPARQL web proxy is by default listening on `/sparql`. If you want to adjust that alter the configuration in the `sparqlProxy` section. Note that SPARQL is currently not supported by the in-memory store.

## Folder Structure

### data/public

Static files (JavaScript, CSS, images) for HTML rendering. `js/render-ld.js` contains the JSON-LD graph render code.

### data/scripts

Scripts for external applications (Fuseki).

### data/templates

HTML templates for graph rendering and errors.

## Support

Issues & feature requests should be reported on Github.

Pull requests are very welcome.

## HTTPRange-14 or Ceci n'est pas une pipe

Trifid-LD does not care about [HTTPRange-14](http://en.wikipedia.org/wiki/HTTPRange-14) and neither should you. We consider the extra 303 redirect round-trip a waste of precious response time. You get back what you asked for in content-negotiation.

![Ceci n'est pas une pipe](http://upload.wikimedia.org/wikipedia/en/thumb/b/b9/MagrittePipe.jpg/300px-MagrittePipe.jpg)

We are aware that the [URI and the representation](http://en.wikipedia.org/wiki/The_Treachery_of_Images) are not the same thing but if we ever have to care about it, we would implement it using the  [Content-Location](http://tools.ietf.org/html/rfc7231#section-3.1.4.2) header field.

## License

Copyright 2015 Zazuko GmbH

Trifid-LD is licensed under the Apache License, Version 2.0. Please see LICENSE and NOTICE for details.

