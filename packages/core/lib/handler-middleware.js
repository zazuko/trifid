'use strict';


module.exports = function (handler) {
  return function (req, res, next) {
    var iri = req.absoluteUrl();

    if (req.method === 'GET') {
      handler.get(req, res, next, iri)
    } else {
      next();
    }
  };
};