'use strict'

var url = require('url')
var AbstractStore = require('./abstract-store')

var SplitStore = function (rdf, options) {
  var store = new rdf.InMemoryStore()

  if (!options.graph) {
    throw new Error('graph option missing')
  }

  if (!options.split) {
    throw new Error('split option missing')
  }

  options.split(options.graph, new rdf.promise.Store(store))

  var mapIri = function (iri) {
    var parsed = url.parse(iri)

    if (options.hostname) {
      parsed.hostname = options.hostname
    }

    if (options.port) {
      parsed.port = options.port
    }

    delete parsed.host

    return url.format(parsed)
  }

  this.graph = function (iri, callback) {
    store.graph(mapIri(iri), callback)
  }

  this.add = function (iri, graph, callback) {
    callback(null, 'read only store')
  }

  this.delete = function (iri, callback) {
    callback(false, 'read only store')
  }
}

SplitStore.prototype = new AbstractStore()
SplitStore.constructor = SplitStore

module.exports = function (rdf) {
  return {
    SplitStore: SplitStore.bind(null, rdf)
  }
}
