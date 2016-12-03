/* global log */

'use strict'

var clone = require('lodash/clone')
var defaults = require('lodash/defaults')
var SparqlHttpClient = require('sparql-http-client')

SparqlHttpClient.fetch = require('node-fetch')

function authBasicHeader (user, password) {
  return 'Basic ' + new Buffer(user + ':' + password).toString('base64')
}

function sparqlProxy (options) {
  if (options) {
    var queryOptions = {}

    if (options.authentication) {
      queryOptions.headers = {
        Authorization: authBasicHeader(options.authentication.user, options.authentication.password)
      }
    }

    var queryOperation = options.queryOperation || 'postQueryDirect'
    var client = new SparqlHttpClient({endpointUrl: options.endpointUrl})
  }

  return function (req, res, next) {
    if (!options) {
      return next()
    }

    var query

    if (req.method === 'GET') {
      query = req.query.query
    } else if (req.method === 'POST') {
      query = req.body.query || req.body
    } else {
      return next()
    }

    log.info({script: __filename}, 'handle SPARQL request for endpoint: ' + options.endpointUrl)
    log.debug({script: __filename}, 'SPARQL query:' + query)

    // merge configuration query options with request query options
    var currentQueryOptions = defaults(clone(queryOptions), {accept: req.headers.accept})

    return client[queryOperation](query, currentQueryOptions).then(function (result) {
      result.headers.forEach(function (value, name) {
        res.setHeader(name, value)
      })

      result.body.pipe(res)
    }).catch(next)
  }
}

module.exports = sparqlProxy
