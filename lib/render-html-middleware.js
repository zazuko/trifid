'use strict'

var fs = require('fs')
var hijackResponse = require('hijackresponse')
var path = require('path')
var streamBuffers = require('stream-buffers')

require('express-negotiate')

function fileContent (filename) {
  try {
    return fs.readFileSync(filename).toString()
  } catch (err) {
    return null
  }
}

function firstFileContent (filenames) {
  return filenames.filter(function (filename) {
    return filename
  }).reduce(function (content, filename) {
    return content || fileContent(filename)
  }, null)
}

function middleware (options, req, res, next) {
  req.negotiate({
    html: function () {
      req.headers['accept'] = options.graphMediaType

      hijackResponse(res, function (err, res) {
        if (err) {
          res.unhijack()

          return next(err)
        }

        var graphBuffer = new streamBuffers.WritableStreamBuffer()

        graphBuffer.on('finish', function () {
          var graphString = graphBuffer.getContentsAsString('utf8')
          var body = options.templateContent.replace('%graph%', graphString)

          res.end(body)
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
  options.graphMediaType = options.graphMediaType || 'text/turtle'

  var templatePaths = [
    options.template,
    path.join(process.cwd(), 'data/templates/graph.html'),
    path.join(__dirname, '../data/templates/graph.html')
  ]

  options.templateContent = firstFileContent(templatePaths)

  return middleware.bind(null, options)
}

factory.middleware = middleware

module.exports = factory
