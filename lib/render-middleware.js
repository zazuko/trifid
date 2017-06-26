'use strict'

var hijackResponse = require('hijackresponse')
var streamBuffers = require('stream-buffers')
var without = require('lodash/without')

require('express-negotiate')

function render (res, locals, callback) {
  return Promise.resolve().then(function () {
    return callback(locals)
  }).then(function (output) {
    res.end(output)
  })
}

function middleware (options, req, res, next) {
  req.negotiate({
    html: function () {
      // remove all request header sent from the client which are not required
      without(Object.keys(req.headers), 'host', 'x-forwarded-host', 'x-forwarded-proto').forEach(function (name) {
        delete req.headers[name]
      })

      // set html middleware request headers for the handler
      req.headers['accept'] = options.render.accept

      hijackResponse(res, function (err, res) {
        if (err) {
          res.unhijack()

          return next(err)
        }

        var graphBuffer = new streamBuffers.WritableStreamBuffer()

        graphBuffer.on('finish', function () {
          var graphString = graphBuffer.getContentsAsString('utf8')

          var locals = {
            iri: req.absoluteUrl(),
            statusCode: res.statusCode,
            graph: graphString
          }

          // remove all response headers sent from handler
          if (res._headers) {
            Object.keys(res._headers).forEach(function (name) {
              res.removeHeader(name)
            })
          }

          // set new response headers
          res.setHeader('content-type', 'text/html')

          // use renderer to build body
          if (res.statusCode === 200) {
            render(res, locals, options.render)
          } else {
            // use .error method if renderer has one
            if (options.render.error) {
              render(res, locals, options.render.error)
            } else {
              render(res, locals, options.render)
            }
          }
        })

        res.pipe(graphBuffer)
      })

      next()
    },

    default: function () {
      next()
    }
  })
}

function factory (options) {
  options = options || {}

  // load render module and forward options to the factory
  options.render = require(options.module)(options)

  return middleware.bind(null, options)
}

factory.middleware = middleware

module.exports = factory
