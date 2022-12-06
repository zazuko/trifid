import debugLib from 'debug'
import ParsingClient from 'sparql-http-client/ParsingClient.js'
import { resolve } from 'url'

const debug = debugLib('trifid-handler-http-in-rdf')

const defaults = {
  authentication: false, redirectQuery: `
    PREFIX http:   <http://www.w3.org/2011/http#>
    SELECT ?location ?code WHERE {
      GRAPH ?g {
            ?request a http:GetRequest ;
            http:response [
                a http:Response ;
                http:responseCode ?code ;
                http:location ?location 
            ] ;
            http:requestURI <\${iri}>     
      }
    } LIMIT 1`
}

const authBasicHeader = (user, password) => {
  return 'Basic ' + Buffer.from(user + ':' + password).toString('base64')
}

export class HttpInRDFHandler {
  constructor (options) {
    this.authentication = options.authentication
    this.redirectQuery = options.redirectQuery
    this.client = new ParsingClient({ endpointUrl: options.endpointUrl })
  }

  buildQueryOptions () {
    const queryOptions = {}
    if (this.authentication && this.authentication.user &&
      this.authentication.password) {
      queryOptions.headers = {
        Authorization: authBasicHeader(this.authentication.user,
          this.authentication.password)
      }
    }
    return queryOptions
  }

  async queryRedirect (iri) {
    const redirectQuery = this.redirectQuery.split('${iri}').join(iri)
    debug('SPARQL redirect query for IRI <' + iri + '> : ' + redirectQuery)
    const bindings = await this.client.query.select(redirectQuery,
      this.buildQueryOptions())
    if (bindings.length) {
      return bindings[0]
    }
    return false
  }

  handle (req, res, next) {
    if (req.method === 'GET') {
      this.get(req, res, next, req.iri)
    } else {
      next()
    }
  }

  async get (req, res, next, iri) {
    iri = encodeURI(iri)
    debug('handle GET request for IRI <' + iri + '>')
    const redirect = await this.queryRedirect(iri)
    if (redirect) {
      const { code, location } = redirect
      res.status(code.value).redirect(location.value)
    } else {
      return next()
    }
  }
}

export const factory = trifid => {
  const { config } = trifid
  const { endpointUrl } = config

  const endpoint = endpointUrl || '/query'

  return (req, res, next) => {
    const handler = new HttpInRDFHandler({
      ...defaults, ...config, endpointUrl: resolve(req.absoluteUrl(), endpoint)
    })
    handler.handle(req, res, next)
  }
}

export default factory
