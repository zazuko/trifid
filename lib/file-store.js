'use strict'

var fs = require('fs')
var path = require('path')
var url = require('url')
var AbstractStore = require('./abstract-store')

var FileStore = function (rdf, options) {
  options = options || {}

  var self = this

  this.parse = options.parse || rdf.parseTurtle
  this.serialize = options.serialize || rdf.serializeNTriples
  this.path = options.path || '.'
  this.graphFile = options.graphFile || function (p) {
    return p.pathname.split('/').slice(1).join('_') + '.ttl'
  }

  var graphPath = function (iri) {
    var parsed = url.parse(iri)

    return path.join(self.path, self.graphFile(parsed))
  }

  var graphExists = function (iri) {
    return fs.existsSync(graphPath(iri))
  }

  this.graph = function (iri, callback) {
    if (!graphExists(iri)) {
      return callback(null)
    }

    self.parse(fs.readFileSync(graphPath(iri)).toString(), callback, iri)
  }

  this.add = function (iri, graph, callback) {
    self.serialize(graph, function (serialized) {
      fs.writeFileSync(graphPath(iri), serialized)

      callback(graph)
    }, iri)
  }

  this.delete = function (iri, callback) {
    if (graphExists(iri)) {
      fs.unlink(graphPath(iri))
    }

    callback(true)
  }
}

FileStore.prototype = new AbstractStore()
FileStore.prototype.constructor = FileStore

module.exports = function (rdf) {
  rdf.FileStore = FileStore.bind(null, rdf)
}

module.exports.store = FileStore
