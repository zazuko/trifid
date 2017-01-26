/* global log */

'use strict'

var httpError = require('http-errors')
var SparqlHttpClient = require('sparql-http-client')

SparqlHttpClient.fetch = require('node-fetch')

function SparqlHandler (options) {
  this.resourceNoSlash = options.resourceNoSlash
  this.resourceExistsQuery = options.resourceExistsQuery
  this.resourceGraphQuery = options.resourceGraphQuery
  this.containerExistsQuery = options.containerExistsQuery
  this.containerGraphQuery = options.containerGraphQuery
  this.client = new SparqlHttpClient({endpointUrl: options.endpointUrl})
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
  log.debug({script: __filename}, 'SPARQL exists query for IRI <' + iri + '> : ' + query)

  return this.client.selectQuery(query).then(function (res) {
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
  log.debug({script: __filename}, 'SPARQL query for IRI <' + iri + '> : ' + query)

  return this.client.constructQuery(query, {accept: accept}).then(function (res) {
    if (res.status !== 200) {
      throw httpError(res.status)
    }

    var headers = {}

    res.headers.forEach(function (value, name) {
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

SparqlHandler.prototype.get = function (req, res, next, iri) {
  var self = this

  log.info({script: __filename}, 'handle GET request for IRI <' + iri + '>')

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
