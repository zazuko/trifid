
var
  request = require('request');


var sparqlProxy = function (options) {
  return function (req, res, next) {
    var
      headers = {'Accept': req.headers.accept, 'Content-Type': 'application/sparql-query'},
      query;

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

    request
      .post(options.endpointUrl, {headers: headers, body: query})
      .pipe(res);
  };
};


module.exports = sparqlProxy;