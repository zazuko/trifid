/* global log:false */

'use strict';

var
  request = require('request'),
  url = require('url');


module.exports = function (options) {
  if (options == null) {
    options = {};
  }

  if ('buildQuery' in options) {
    this.buildQuery = options.buildQuery;
  } else {
    this.buildQuery = function (iri) {
      return 'CONSTRUCT {?s ?p ?o} WHERE { GRAPH <' + iri + '> {?s ?p ?o}}';
    };
  }

  if ('buildExistsQuery' in options) {
    this.buildExistsQuery = options.buildExistsQuery;
  }

  var mapIri = function (iri) {
    var parsed = url.parse(iri);

    if ('hostname' in options) {
      parsed.hostname = options.hostname;
    }

    if ('port' in options) {
      parsed.port = options.port;
    }

    delete parsed.host;

    return url.format(parsed);
  };

  var getSparqlUrl = function (query) {
    return options.endpointUrl + '?query=' + encodeURIComponent(query);
  };

  this.get = function (req, res, next, iri) {
    var self = this;

    log.info({script: __filename}, 'handle GET request for IRI <' + iri + '>');

    var runQuery = function () {
      var query = self.buildQuery(mapIri(iri));

      log.debug({script: __filename}, 'SPARQL query for IRI <' + iri + '> : ' + query);

      request
        .get(getSparqlUrl(query), {headers: {accept: req.headers.accept}})
        .on('response', function (response) {
          if (response.statusCode !== 200) {
            res.writeHead(500);
            res.end();
          }
        })
        .pipe(res);
    };

    var runExistsQuery = function (callback) {
      var query = self.buildExistsQuery(mapIri(iri));

      log.debug({script: __filename}, 'SPARQL exists query for IRI <' + iri + '> : ' + query);

      request.get({
        url: getSparqlUrl(query),
        headers: {Accept: 'application/sparql-results+json'}
      }, function (error, response, body) {
        if (!error && response.statusCode == 200 && JSON.parse(body).boolean) {
          callback();
        } else {
          res.writeHead(404);
          res.end();
        }
      });
    };

    if ('buildExistsQuery' in self) {
      runExistsQuery(runQuery);
    } else {
      runQuery();
    }
  };
};