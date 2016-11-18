/* global log */

'use strict'

var request = require('request')

module.exports = function (options) {
  options = options || {}

  this.buildQuery = options.buildQuery || function (iri) {
    return 'CONSTRUCT {?s ?p ?o} WHERE { GRAPH <' + iri + '> {?s ?p ?o}}'
  }

  this.buildExistsQuery = options.buildExistsQuery

  var getSparqlUrl = function (query) {
    return options.endpointUrl + '?query=' + encodeURIComponent(query)
  }

  this.get = function (req, res, next, iri) {
    var self = this

    log.info({script: __filename}, 'handle GET request for IRI <' + iri + '>')

    var runQuery = function () {
      var query = self.buildQuery(iri)

      log.debug({script: __filename}, 'SPARQL query for IRI <' + iri + '> : ' + query)

      request
        .get(getSparqlUrl(query), {headers: {accept: req.headers.accept}})
        .on('response', function (response) {
          if (response.statusCode !== 200) {
            res.writeHead(500)
            res.end()
          }
        })
        .pipe(res)
    }

    var runExistsQuery = function (callback) {
      var query = self.buildExistsQuery(iri)

      log.debug({script: __filename}, 'SPARQL exists query for IRI <' + iri + '> : ' + query)

      request.get({
        url: getSparqlUrl(query),
        headers: {Accept: 'application/sparql-results+json'}
      }, function (error, response, body) {
        if (!error && response.statusCode === 200 && JSON.parse(body).boolean) {
          callback()
        } else {
          res.writeHead(404)
          res.end()
        }
      })
    }

    if (self.buildExistsQuery) {
      runExistsQuery(runQuery)
    } else {
      runQuery()
    }
  }
}
