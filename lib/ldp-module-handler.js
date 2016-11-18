'use strict'

var Ldp = require('ldp')

module.exports = function (options) {
  this.store = new options.StoreClass(options.storeOptions)
  this.ldp = new Ldp(options.rdf, this.store)

  this.get = function (req, res, next, iri) {
    this.ldp.get(req, res, next, iri)
  }
}
