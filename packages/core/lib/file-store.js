/* global rdf:true */
'use strict';

var
  fs = require('fs'),
  path = require('path'),
  url = require('url'),
  AbstractStore = require('./abstract-store');


var FileStore = function (rdf, options) {
  if (options == null) {
    options = {};
  }

  var self = this;

  this.parse = 'parser' in options ? options.parse : rdf.parseTurtle;
  this.serialize = 'serialize' in options ? options.serialize : rdf.serializeNTriples;
  this.path = 'path' in options ? options.path : '.';
  this.graphFile = 'graphFile' in options ? options.graphFile : function (p) {
    return p.pathname.split('/').slice(1).join('_') + '.ttl';
  };

  var graphPath = function (iri) {
    var parsed = url.parse(iri);

    return path.join(self.path, self.graphFile(parsed));
  };

  var graphExists = function (iri) {
    return fs.existsSync(graphPath(iri));
  };

  this.graph = function (iri, callback) {
    if (!graphExists(iri)) {
      return callback(null);
    }

    self.parse(
      fs.readFileSync(graphPath(iri)).toString(),
      callback,
      iri);
  };

  this.add = function (iri, graph, callback) {
    self.serialize(
      graph,
      function (serialized) {
        fs.writeFileSync(graphPath(iri), serialized);

        callback(graph);
      }, iri);
  };

  this.delete = function (iri, callback) {
    if (graphExists(iri)) {
      fs.unlink(graphPath(iri));
    }

    callback(true);
  };
};

FileStore.prototype = new AbstractStore();
FileStore.prototype.constructor = FileStore;


module.exports = function (rdf) {
  rdf.FileStore = FileStore.bind(null, rdf);
};

module.exports.store = FileStore;