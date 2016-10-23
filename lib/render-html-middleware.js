/* global log:false */

'use strict';

var
  fs = require('fs'),
  path = require('path'),
  streamBuffers = require("stream-buffers");


require('express-negotiate');

function fileContent (filename) {
  try {
    console.log(filename)
    return fs.readFileSync(filename).toString()
  } catch (err) {
    return null
  }
}

module.exports = function (handler) {
  var template = fileContent(path.join(process.cwd(), 'data/templates/graph.html')) ||
    fileContent(path.join(__dirname, '../data/templates/graph.html'))

  var notFoundPage = fileContent(path.join(process.cwd(), 'data/templates/404.html')) ||
    fileContent(path.join(__dirname, '../data/templates/404.html'))

  var handlerGetRequest = function (iri, mimetype) {
    return new Promise(function (resolve, reject) {
      var contentBuffer = new streamBuffers.WritableStreamBuffer();

      contentBuffer.setHeader = function () {};
      contentBuffer.writeHead = function (statusCode) { this.statusCode = statusCode; };

      contentBuffer.on('close', function () {
        if (contentBuffer.statusCode === 404) {
          resolve(null);
        } else {
          resolve(contentBuffer.getContents().toString());
        }
      });

      contentBuffer.on('error', function () {
        reject();
      });

      handler.get(
        {headers: {accept: mimetype}},
        contentBuffer,
        function () { resolve(null); },
        iri);
    });
  };

  return function (req, res, next) {
    req.negotiate({
      'html': function() {
        var
          iri = req.absoluteUrl();

        if (req.method === 'GET') {
          log.info({script: __filename}, 'handle GET request for IRI <' + iri + '>');

          handlerGetRequest(iri, 'text/turtle')
            .then(function (content) {
              if (content == null || content.length === 0) {
                res.writeHead(404);
                res.end(notFoundPage);
              } else {
                // we have already the content, so let's inject it to avoid another round trip
                var body = template.replace('%graph%', content);

                res.end(body);
              }
            })
            .catch(function () {
              res.writeHead(500);
              res.end();
            });
        } else {
          next();
        }
      },
      'default': function () {
        next();
      }
    });
  };
};
