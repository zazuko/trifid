'use strict'

var rdf = require('rdf-ext')
var FileStore = require('rdf-store-fs')
var Ldp = require('ldp')

module.exports = function (options) {
  this.store = new FileStore(rdf, {path: options.path})

  this.store.graphFile = function (iri) {
    return iri.pathname + '.ttl'
  }

  this.ldp = new Ldp(options.rdf, {
    graphStore: this.store
  })

  this.get = function (req, res, next, iri) {
    this.ldp.get(req, res, next, iri)
  }
}
