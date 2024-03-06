# trifid-handle-redirects

> [!WARNING]
> This package is deprecated and will be removed in the future.
> Please configure redirects directly using the entity renderer plugin.

## Overview

This document provides guidance for using the `trifid-handle-redirects` plugin with [Trifid](https://github.com/zazuko/trifid), a versatile handler for managing HTTP redirects of RDF IRIs.
In the RDF world, IRIs ideally remain constant, but occasionally they change.
This plugin facilitates HTTP redirects for such scenarios, ensuring that HTTP dereferencing remains functional and that users are informed of any IRI changes.

## Workflow

The operation of this plugin involves a simple yet effective process:

1. **Request Reception:** Trifid receives a request for a specific HTTP IRI.
2. **SPARQL Lookup:** It queries this resource via SPARQL.
3. **Redirect Triggering:** If the returned triples include a redirect (as detailed below), Trifid issues an HTTP redirect to the client.

### Example

Consider the following command:

```sh
curl -v https://politics.ld.admin.ch/council/FA
```

This would yield:

```
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

In SPARQL, the corresponding representation is shown at [this link](https://s.zazuko.com/2FBeyAp). Note that redirects only affect dereferencing.
In SPARQL queries, you'll receive the configured triples as is from the specified endpoint.

## Installation and Configuration

### Installation

Install the plugin via npm:

```sh
npm install @zazuko/trifid-handle-redirects
```

### Configuration

Incorporate the plugin into your Trifid configuration file:

```yaml
plugins:
  # […]
  arbitrary-name:
    module: "@zazuko/trifid-handle-redirects"
```

## Defaults

### Redirect Description

Redirects should be defined as follows:

```ttl
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

In this example, `ex:exampleResource` is redirected to `ex:redirectedTo`.
Adjust these URIs to suit your namespace.

### Default SPARQL Query

The default query used by the plugin is as follows:

```sparql
PREFIX http2011: <http://www.w3.org/2011/http#>
PREFIX http2006: <http://www.w3.org/2006/http#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?req ?res ?location ?responseCode ?validFrom
WHERE {
  GRAPH ?g {

    # Handle 2011 version
    {
      ?req2011 rdf:type http2011:GetRequest.
      ?req2011 http2011:requestURI <\${iri}>.
      ?req2011 http2011:response ?res2011.

      ?res2011 rdf:type http2011:Response.
      ?res2011 http2011:location ?location2011.
      ?res2011 http2011:responseCode ?responseCode2011.

      OPTIONAL {
        ?res2011 <http://schema.org/validFrom> ?validFrom2011.
      }
    }

    UNION

    # Handle 2006 version
    {
      ?req2006 rdf:type http2006:GetRequest.
      ?req2006 http2006:requestURI <\${iri}>.
      ?req2006 http2006:response ?res2006.

      ?res2006 rdf:type http2006:Response.
      ?res2006 http2006:location ?location2006.
      ?res2006 http2006:responseCode ?responseCode2006.

      OPTIONAL {
        ?res2006 <http://schema.org/validFrom> ?validFrom2006.
      }
    }

    # Combine results, using priority for 2011 version over 2006 version
    BIND(COALESCE(?req2011, ?req2006) AS ?req)
    BIND(COALESCE(?res2011, ?res2006) AS ?res)
    BIND(COALESCE(?location2011, ?location2006) AS ?location)
    BIND(COALESCE(?validFrom2011, ?validFrom2006) AS ?validFrom)
    # Just get the response code as a string instead of the full IRI
    BIND(STRAFTER(STR(COALESCE(?responseCode2011, ?responseCode2006)), "#") AS ?responseCode)
  }
}
LIMIT 1
```

This supports `http://www.w3.org/2011/http#` and `http://www.w3.org/2006/http#` prefixes.
