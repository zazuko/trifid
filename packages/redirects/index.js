import debugLib from 'debug'
import ParsingClient from 'sparql-http-client/ParsingClient.js'

const debug = debugLib('trifid-handler-http-in-rdf')

const defaults = {
  authentication: false,
  redirectQuery: `
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
  `,
}

const authBasicHeader = (user, password) => {
  return 'Basic ' + Buffer.from(user + ':' + password).toString('base64')
}

export class HttpInRDFHandler {
  constructor(options) {
    this.authentication = options.authentication
    this.redirectQuery = options.redirectQuery
    this.client = new ParsingClient({ endpointUrl: options.endpointUrl })
  }

  buildQueryOptions () {
    const queryOptions = {}
    if (
      this.authentication &&
      this.authentication.user &&
      this.authentication.password
    ) {
      queryOptions.headers = {
        Authorization: authBasicHeader(
          this.authentication.user,
          this.authentication.password,
        ),
      }
    }
    return queryOptions
  }

  async queryRedirect (iri) {
    const redirectQuery = this.redirectQuery.split('${iri}').join(iri) // eslint-disable-line
    debug(
      'SPARQL redirect query for IRI <' + iri + '> : ' + redirectQuery,
    )
    const bindings = await this.client.query.select(
      redirectQuery,
      this.buildQueryOptions(),
    )
    if (bindings.length) {
      return bindings[0]
    }

    return false
  }

  handle (req, res, next) {
    if (req.method === 'GET') {
      this.get(req, res, next)
    } else {
      next()
    }
  }

  async get (req, res, next) {
    const iri = encodeURI(req.iri)
    debug('handle GET request for IRI <' + iri + '>')
    const redirect = await this.queryRedirect(iri)
    if (redirect) {
      const { responseCode, location } = redirect
      res.status(parseInt(responseCode.value, 10)).redirect(location.value)
    } else {
      return next()
    }
  }
}

export const factory = (trifid) => {
  const { config } = trifid
  const { endpointUrl } = config

  const endpoint = endpointUrl || '/query'

  return (req, res, next) => {
    const handler = new HttpInRDFHandler({
      ...defaults,
      ...config,
      endpointUrl: new URL(endpoint, req.absoluteUrl()),
    })
    handler.handle(req, res, next)
  }
}

export default factory
