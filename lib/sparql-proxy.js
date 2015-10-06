
var
  request = require('request');

var directPost = function (req, res, endpointUrl, query) {
  headers = {'Accept': req.headers.accept, 'Content-Type': 'application/sparql-query'};

  request
    .post(endpointUrl, {headers: headers, body: query})
    .pipe(res);
}

var urlencodedPost = function (req, res, endpointUrl, query) {
  var headers = {'Accept': req.headers.accept, 'Content-Type': 'application/x-www-form-urlencoded'};

  request
    .post(endpointUrl, {headers: headers, form: {query: query}})
    .pipe(res);
}

var sparqlProxy = function (options) {
  return function (req, res, next) {
    var query;

    if (req.method === 'GET') {
      query = req.query.query;
    } else if (req.method === 'POST') {
      if ('query' in req.body) {
        query = req.body.query;
      } else {
        query = req.body;
      }
    } else {
      return next();
    }

    log.info({script: __filename}, 'handle SPARQL request for endpoint: ' + options.endpointUrl);
    log.debug({script: __filename}, 'SPARQL query:' + query);

    switch(options.queryOperation) {
      case 'urlencoded':
        return urlencodedPost(req, res, options.endpointUrl, query)
      default:
        return directPost(req, res, options.endpointUrl, query)
    }
  };
};


module.exports = sparqlProxy;