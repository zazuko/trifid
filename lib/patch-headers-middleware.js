'use strict';


module.exports = function (options) {
  if (options == null) {
    options = {};
  }

  if (!('patchResponse' in options)) {
    options.patchResponse = function (res, headers) { return headers; };
  }

  return function (req, res, next) {
    var writeHead = res.writeHead

    res.writeHead = function (statusCode, headers) {
      this.statusCode = statusCode;

      if (headers == null) {
        headers = {};
      }

      headers = options.patchResponse(this, headers);

      writeHead.bind(this)(statusCode, headers);
    };

    next();
  };
};