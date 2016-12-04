'use strict'

module.exports = function (options) {
  if (options) {
    var handler = new (require(options.module))(options.options)
  }

  return function (req, res, next) {
    if (!options) {
      return next()
    }

    var iri = req.absoluteUrl()

    if (req.method === 'GET') {
      handler.get(req, res, next, iri)
    } else {
      next()
    }
  }
}
