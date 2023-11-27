# trifid-handle-redirects

## Overview

This document provides guidance for using the `trifid-handle-redirects` plugin with [Trifid](https://github.com/zazuko/trifid), a versatile handler for managing HTTP redirects of RDF IRIs. In the RDF world, IRIs ideally remain constant, but occasionally they change. This plugin facilitates HTTP redirects for such scenarios, ensuring that HTTP dereferencing remains functional and that users are informed of any IRI changes.

## Workflow

The operation of this plugin involves a simple yet effective process:

1. **Request Reception:** Trifid receives a request for a specific HTTP IRI.
2. **SPARQL Lookup:** It queries this resource via SPARQL.
3. **Redirect Triggering:** If the returned triples include a redirect (as detailed below), Trifid issues an HTTP redirect to the client.

### Example

Consider the following command:

```bash
curl -v https://politics.ld.admin.ch/council/FA
```

This would yield:

```plaintext
[HTTPS logs removed for brevity]
> GET /council/FA HTTP/2
> Host: politics.ld.admin.ch
> ... [additional request headers] ...
< HTTP/2 302
< ... [response headers] ...
< location: https://ld.admin.ch/FA
...
Found. Redirecting to https://ld.admin.ch/FA
```

In SPARQL, the corresponding representation is shown at [this link](https://s.zazuko.com/2FBeyAp). Note that redirects only affect dereferencing. In SPARQL queries, you'll receive the configured triples as is from the specified endpoint.

## Installation and Configuration

### Installation

Install the plugin via npm:

```sh
npm install @zazuko/trifid-handle-redirects
```

### Configuration

Incorporate the plugin into your Trifid configuration file:

```yaml
middlewares:
  # […]
  arbitrary-name:
    module: "@zazuko/trifid-handle-redirects"
```

## Defaults

### Redirect Description

Redirects should be defined as follows:

```turtle
@prefix http: <http://www.w3.org/2011/http#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix ex: <http://some/resource/> .

ex:redirect a http:GetRequest ;
	http:response [
		a http:Response ;
		http:responseCode http:301 ;
		http:location ex:redirectedTo ;
	] ;
	http:requestURI ex:exampleResource .
```

In this example, `ex:exampleResource` is redirected to `ex:redirectedTo`. Adjust these URIs to suit your namespace.

### Default SPARQL Query

The default query used by the plugin is as follows:

```sparql
PREFIX http:   <http://www.w3.org/2011/http#>
SELECT ?location ?code WHERE {
    GRAPH ?g {
        ?request a http:GetRequest ;
        http:response [
            a http:Response ;
            http:responseCode ?code ;
            http:location ?location
        ] ;
        http:requestURI <CURRENT_RESOURCE>
    }
} LIMIT 1
```
