var debug = require('debug')('trifid:handler-sparql')
var SparqlHttpClient = require('sparql-http-client')
SparqlHttpClient.fetch = require('node-fetch')

function authBasicHeader (user, password) {
  return 'Basic ' + Buffer.from(user + ':' + password).toString('base64')
}

class SparqlHandler {
  constructor (options) {
    this.authentication = options.authentication
    this.resourceNoSlash = options.resourceNoSlash
    this.resourceExistsQuery = options.resourceExistsQuery
    this.resourceGraphQuery = options.resourceGraphQuery
    this.containerExistsQuery = options.containerExistsQuery
    this.containerGraphQuery = options.containerGraphQuery
    this.client = new SparqlHttpClient({ endpointUrl: options.endpointUrl })
  }

  buildQueryOptions () {
    var queryOptions = {}

    if (this.authentication) {
      queryOptions.headers = {
        Authorization: authBasicHeader(this.authentication.user, this.authentication.password)
      }
    }

    return queryOptions
  }

  buildResourceExistsQuery (iri) {
    return this.resourceExistsQuery.split('${iri}').join(iri) // eslint-disable-line no-template-curly-in-string
  }

  buildResourceGraphQuery (iri) {
    return this.resourceGraphQuery.split('${iri}').join(iri) // eslint-disable-line no-template-curly-in-string
  }

  buildContainerExistsQuery (iri) {
    return this.containerExistsQuery.split('${iri}').join(iri) // eslint-disable-line no-template-curly-in-string
  }

  buildContainerGraphQuery (iri) {
    return this.containerGraphQuery.split('${iri}').join(iri) // eslint-disable-line no-template-curly-in-string
  }

  exists (iri, query) {
    debug('SPARQL exists query for IRI <' + iri + '> : ' + query)

    return this.client.selectQuery(query, this.buildQueryOptions()).then(function (res) {
      if (res.status !== 200) {
        return false
      }

      return res.json()
    }).then(function (result) {
      return result && result.boolean
    })
  }

  resourceExists (iri) {
    // if resources with trailing slashes are disabled, don't run the query
    if (this.resourceNoSlash && iri.slice(-1) === '/') {
      return Promise.resolve(false)
    }

    return this.exists(iri, this.buildResourceExistsQuery(iri))
  }

  containerExists (iri) {
    return this.exists(iri, this.buildContainerExistsQuery(iri))
  }

  graphStream (iri, query, accept) {
    debug('SPARQL query for IRI <' + iri + '> : ' + query)

    var queryOptions = this.buildQueryOptions()

    queryOptions.accept = accept

    return this.client.constructQuery(query, queryOptions).then(function (res) {
      if (res.status !== 200) {
        return null
      }

      var headers = {}

      res.headers.forEach(function (value, name) {
        // stream will be decoded by the client -> remove content-encoding header
        if (name === 'content-encoding') {
          return
        }

        headers[name] = value
      })

      return {
        headers: headers,
        stream: res.body
      }
    })
  }

  resourceGraphStream (iri, accept) {
    return this.graphStream(iri, this.buildResourceGraphQuery(iri), accept)
  }

  containerGraphStream (iri, accept) {
    return this.graphStream(iri, this.buildContainerGraphQuery(iri), accept)
  }

  handle (req, res, next) {
    if (req.method === 'GET') {
      this.get(req, res, next, req.iri)
    } else {
      next()
    }
  }

  get (req, res, next, iri) {
    var self = this

    debug('handle GET request for IRI <' + iri + '>')

    this.resourceExists(iri).then(function (exists) {
      if (exists) {
        return self.resourceGraphStream(iri, req.headers.accept)
      }
      if (iri.slice(-1) === '/') {
        return self.containerExists(iri).then(function (exists) {
          if (exists) {
            return self.containerGraphStream(iri, req.headers.accept)
          }
          return null
        })
      }
      return null
    }).then(function (result) {
      if (!result) {
        return next()
      }

      Object.keys(result.headers).forEach(function (name) {
        res.setHeader(name, result.headers[name])
      })

      result.stream.pipe(res)
    }).catch(next)
  }
}

module.exports = SparqlHandler
