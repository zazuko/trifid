# trifid-handle-redirects

SPARQL handler for [Trifid](https://github.com/zazuko/trifid).

# Usage

Install this Trifid plugin using:

```sh
npm install trifid-handle-redirects
```

Add to the trifid-configuration file

```yaml
middlewares:
  # […]
  arbitrary-name:
    module: trifid-handle-redirects   
```

## Defaults

### Redirect description

This handler expects redirects to be described in the following way:

```turtle
@prefix http: <http://www.w3.org/2011/http#> .
@prefix ex:   <http://some/resource/> .

ex:redirect
    a               http:GetRequest ;
    http:response   [ a                 http:Response ;
                      http:responseCode http:301 ;
                      http:location     ex:redirectedTo ; ] ;
    http:requestURI ex:exampleResource .
```

In this example, a redirect is declared for the resource `ex:exampleResource`, to the location `ex:redirectedTo`.

### Default query

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
