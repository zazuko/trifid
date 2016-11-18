'use strict'

var handlerMiddleware = require('./handler-middleware')
var SparqlHandler = require('./sparql-handler')

module.exports = function (options) {
  var sparqlHandler
  var wrapperHandler = {}

  if (options.resultsPerPage) {
    options.paging = true
  }

  var escapeLiteral = function (value) {
    return value.replace(/"/g, '\\"')
  }

  var processVariable = function (variableConfig, value, query) {
    variableConfig.type = variableConfig.type || 'Literal'

    // not required and string is empty -> nothing to do
    if (!variableConfig.required && value.trim() === '') {
      return query
    }

    if (variableConfig.type === 'Literal') {
      return query.split(variableConfig.variable).join('"""' + escapeLiteral(value) + '"""')
    } else if (variableConfig.type === 'NamedNode') {
      return query.split(variableConfig.variable).join('<' + value + '>')
    }
  }

  wrapperHandler.get = function (req, res, next, iri) {
    sparqlHandler.buildQuery = function () {
      var page = 0
      var query = options.queryTemplate

      if (options.variables) {
        Object.keys(options.variables).forEach(function (parameter) {
          var value = parameter in req.query ? req.query[parameter] : ''

          query = processVariable(options.variables[parameter], value, query)
        })
      }

      if (options.paging) {
        if (req.query.page) {
          page = parseInt(req.query.page) - 1
        }

        query += ' OFFSET ' + page * options.resultsPerPage + ' LIMIT ' + options.resultsPerPage
      }

      return query
    }

    return sparqlHandler.get(req, res, next, iri)
  }

  sparqlHandler = new SparqlHandler({endpointUrl: options.endpointUrl})

  return handlerMiddleware(wrapperHandler)
}
