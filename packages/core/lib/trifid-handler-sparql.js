/* global log */

'use strict'

var httpError = require('http-errors')
var SparqlHttpClient = require('sparql-http-client')

SparqlHttpClient.fetch = require('node-fetch')

function SparqlHandler (options) {
  this.existsQuery = options.existsQuery
  this.graphQuery = options.graphQuery
  this.client = new SparqlHttpClient({endpointUrl: options.endpointUrl})
}

SparqlHandler.prototype.buildExistsQuery = function (iri) {
  return this.existsQuery.split('${iri}').join(iri) // eslint-disable-line no-template-curly-in-string
}

SparqlHandler.prototype.buildGraphQuery = function (iri) {
  return this.graphQuery.split('${iri}').join(iri) // eslint-disable-line no-template-curly-in-string
}

SparqlHandler.prototype.exists = function (iri) {
  var query = this.buildExistsQuery(iri)

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
  var query = this.buildGraphQuery(iri)

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
