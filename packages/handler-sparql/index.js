/* global log */

'use strict'

var httpError = require('http-errors')
var SparqlHttpClient = require('sparql-http-client')

SparqlHttpClient.fetch = require('node-fetch')

function SparqlHandler (options) {
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

SparqlHandler.prototype.exists = function (iri) {
  var query

  if (this.containerExistsQuery && iri.slice(-1) === '/') {
    query = this.buildContainerExistsQuery(iri)
  } else {
    query = this.buildResourceExistsQuery(iri)
  }

  log.debug({script: __filename}, 'SPARQL exists query for IRI <' + iri + '> : ' + query)

  return this.client.selectQuery(query).then(function (res) {
    if (res.status !== 200) {
      throw new httpError.NotFound()
    }

    return res.json()
  }).then(function (result) {
    if (!result || !result.boolean) {
      throw new httpError.NotFound()
    }
  })
}

SparqlHandler.prototype.graphStream = function (iri, accept) {
  var query

  if (this.containerGraphQuery && iri.slice(-1) === '/') {
    query = this.buildContainerGraphQuery(iri)
  } else {
    query = this.buildResourceGraphQuery(iri)
  }

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

SparqlHandler.prototype.get = function (req, res, next, iri) {
  var self = this

  log.info({script: __filename}, 'handle GET request for IRI <' + iri + '>')

  this.exists(iri).then(function () {
    return self.graphStream(iri, req.headers.accept)
  }).then(function (result) {
    Object.keys(result.headers).forEach(function (name) {
      res.setHeader(name, result.headers[name])
    })

    result.stream.pipe(res)
  }).catch(next)
}

module.exports = SparqlHandler
