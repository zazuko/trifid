var httpError = require('http-errors')
var SparqlHttpClient = require('sparql-http-client')

SparqlHttpClient.fetch = require('node-fetch')

function authBasicHeader (user, password) {
  return 'Basic ' + Buffer.from(user + ':' + password).toString('base64')
}

function SparqlHandler (options) {
  this.authentication = options.authentication
  this.resourceNoSlash = options.resourceNoSlash
  this.resourceExistsQuery = options.resourceExistsQuery
  this.resourceGraphQuery = options.resourceGraphQuery
  this.containerExistsQuery = options.containerExistsQuery
  this.containerGraphQuery = options.containerGraphQuery
  this.client = new SparqlHttpClient({endpointUrl: options.endpointUrl})
}

SparqlHandler.prototype.buildQueryOptions = function () {
  var queryOptions = {}

  if (this.authentication) {
    queryOptions.headers = {
      Authorization: authBasicHeader(this.authentication.user, this.authentication.password)
    }
  }

  return queryOptions
}

SparqlHandler.prototype.buildResourceExistsQuery = function (iri) {
  return this.resourceExistsQuery.split('${iri}').join(iri) // eslint-disable-line no-template-curly-in-string
}

SparqlHandler.prototype.buildResourceGraphQuery = function (iri) {
  return this.resourceGraphQuery.split('${iri}').join(iri) // eslint-disable-line no-template-curly-in-string
}

SparqlHandler.prototype.buildContainerExistsQuery = function (iri) {
  return this.containerExistsQuery.split('${iri}').join(iri) // eslint-disable-line no-template-curly-in-string
}

SparqlHandler.prototype.buildContainerGraphQuery = function (iri) {
  return this.containerGraphQuery.split('${iri}').join(iri) // eslint-disable-line no-template-curly-in-string
}

SparqlHandler.prototype.exists = function (iri, query) {
  console.log('SPARQL exists query for IRI <' + iri + '> : ' + query)

  return this.client.selectQuery(query, this.buildQueryOptions()).then(function (res) {
    if (res.status !== 200) {
      return false
    }

    return res.json()
  }).then(function (result) {
    return result && result.boolean
  })
}

SparqlHandler.prototype.resourceExists = function (iri) {
  // if resources with trailing slashes are disabled don't even run the query
  if (this.resourceNoSlash && iri.slice(-1) === '/') {
    return Promise.resolve(false)
  }

  return this.exists(iri, this.buildResourceExistsQuery(iri))
}

SparqlHandler.prototype.containerExists = function (iri) {
  return this.exists(iri, this.buildContainerExistsQuery(iri))
}

SparqlHandler.prototype.graphStream = function (iri, query, accept) {
  console.log('SPARQL query for IRI <' + iri + '> : ' + query)

  var queryOptions = this.buildQueryOptions()

  queryOptions.accept = accept

  return this.client.constructQuery(query, queryOptions).then(function (res) {
    if (res.status !== 200) {
      throw httpError(res.status)
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

SparqlHandler.prototype.resourceGraphStream = function (iri, accept) {
  return this.graphStream(iri, this.buildResourceGraphQuery(iri), accept)
}

SparqlHandler.prototype.containerGraphStream = function (iri, accept) {
  return this.graphStream(iri, this.buildContainerGraphQuery(iri), accept)
}

SparqlHandler.prototype.handle = function (req, res, next) {
  if (req.method === 'GET') {
    this.get(req, res, next, req.iri)
  } else {
    next()
  }
}

SparqlHandler.prototype.get = function (req, res, next, iri) {
  var self = this

  console.log('handle GET request for IRI <' + iri + '>')

  this.resourceExists(iri).then(function (exists) {
    if (exists) {
      return self.resourceGraphStream(iri, req.headers.accept)
    } else if (iri.slice(-1) === '/') {
      return self.containerExists(iri).then(function (exists) {
        if (exists) {
          return self.containerGraphStream(iri, req.headers.accept)
        } else {
          throw new httpError.NotFound()
        }
      })
    } else {
      throw new httpError.NotFound()
    }
  }).then(function (result) {
    Object.keys(result.headers).forEach(function (name) {
      res.setHeader(name, result.headers[name])
    })

    result.stream.pipe(res)
  }).catch(next)
}

module.exports = SparqlHandler
