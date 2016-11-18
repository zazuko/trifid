/* global log */

'use strict'

var request = require('request')

var directPost = function (req, res, endpointUrl, query, options) {
  var headers = {
    'Accept': req.headers.accept,
    'Content-Type': 'application/sparql-query'
  }

  options = options || {}
  options.headers = headers
  options.body = query

  request.post(endpointUrl, options).pipe(res)
}

var urlencodedPost = function (req, res, endpointUrl, query, options) {
  var headers = {
    'Accept': req.headers.accept,
    'Content-Type': 'application/x-www-form-urlencoded'
  }

  options = options || {}
  options.headers = headers
  options.form = {query: query}

  request.post(endpointUrl, options).pipe(res)
}

var sparqlProxy = function (options) {
  var reqOptions = {}

  if (options.authentication) {
    reqOptions.auth = {
      user: options.authentication.user,
      pass: options.authentication.password
    }
  }

  return function (req, res, next) {
    var query

    if (req.method === 'GET') {
      query = req.query.query
    } else if (req.method === 'POST') {
      if ('query' in req.body) {
        query = req.body.query
      } else {
        query = req.body
      }
    } else {
      return next()
    }

    log.info({script: __filename}, 'handle SPARQL request for endpoint: ' + options.endpointUrl)
    log.debug({script: __filename}, 'SPARQL query:' + query)

    switch (options.queryOperation) {
      case 'urlencoded':
        return urlencodedPost(req, res, options.endpointUrl, query, reqOptions)

      default:
        return directPost(req, res, options.endpointUrl, query, reqOptions)
    }
  }
}

module.exports = sparqlProxy
