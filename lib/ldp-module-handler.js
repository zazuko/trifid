'use strict';

var
  url = require('url'),
  Ldp = require('ldp');


module.exports = function (options) {
  this.store = new options.StoreClass(options.storeOptions);
  this.ldp = new Ldp(options.rdf, this.store);

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

  this.get = function (req, res, next, iri) {
    this.ldp.get(req, res, next, mapIri(iri));
  };
};