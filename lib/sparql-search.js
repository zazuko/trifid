'use strict';

var
  handlerMiddleware = require('./handler-middleware'),
  SparqlHandler = require('./sparql-handler');


module.exports = function (options) {
  var
    sparqlHandler,
    wrapperHandler = {};

  if ('resultsPerPage' in options) {
    options.paging = true;
  }

  var escapeLiteral = function (value) {
    return value.replace(/"/g, '\\"')
  };

  var processVariable = function (variableConfig, value, query) {
    if (!('required' in variableConfig)) {
      variableConfig.required = false;
    }

    if (!('type' in variableConfig)) {
      variableConfig.type = 'Literal';
    }

    // not required and string is empty -> nothing to do
    if (!variableConfig.required && value.trim() === '') {
      return query;
    }

    if (variableConfig.type === 'Literal') {
      return query.split(variableConfig.variable).join('"""' + escapeLiteral(value) + '"""');
    } else if (variableConfig.type === 'NamedNode') {
      return query.split(variableConfig.variable).join('<' + value + '>');
    }
  };

  wrapperHandler.get = function (req, res, next, iri) {
    sparqlHandler.buildQuery = function () {
      var
        page = 0,
        query = options.queryTemplate;

      if ('variables' in options) {
        Object.keys(options.variables).forEach(function (parameter) {
          query = processVariable(
            options.variables[parameter],
            parameter in req.query ? req.query[parameter]: '',
            query);
        });
      }

      if (options.paging) {
        if ('page' in req.query) {
          page = parseInt(req.query.page) - 1;
        }

        query += ' OFFSET ' + page * options.resultsPerPage + ' LIMIT ' + options.resultsPerPage;
      }

      return query;
    };

    return sparqlHandler.get(req, res, next, iri);
  };

  sparqlHandler = new SparqlHandler({endpointUrl: options.endpointUrl});

  return handlerMiddleware(wrapperHandler);
};