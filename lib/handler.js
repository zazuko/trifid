var url = require('url')

function removeUrlPart (originalUrl, part) {
  var parts = url.parse(originalUrl)

  parts[part] = null

  return url.format(parts)
}

module.exports = function (options) {
  if (options) {
    var handler = new (require(options.module))(options.options)
  }

  return function (req, res, next) {
    if (!options) {
      return next()
    }

    var iri = removeUrlPart(req.absoluteUrl(), 'search')

    if (req.method === 'GET') {
      handler.get(req, res, next, iri)
    } else {
      next()
    }
  }
}
