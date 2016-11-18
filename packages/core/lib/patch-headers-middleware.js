'use strict'

module.exports = function (options) {
  options = options || {}

  options.patchResponse = options.patchResponse || function (res, headers) { return headers }

  return function (req, res, next) {
    var writeHead = res.writeHead

    res.writeHead = function (statusCode, headers) {
      this.statusCode = statusCode

      headers = headers || {}

      headers = options.patchResponse(this, headers)

      writeHead.bind(this)(statusCode, headers)
    }

    next()
  }
}
