/* global log */

'use strict'

module.exports = function (config) {
  var absoluteUrl = require('absolute-url')
  var bodyParser = require('body-parser')
  var express = require('express')
  var handlerMiddleware = require('./lib/handler-middleware')
  var patchHeadersMiddleware = require('./lib/patch-headers-middleware')
  var morgan = require('morgan')
  var path = require('path')
  var bunyan = require('bunyan')
  var renderHtmlMiddleware = require('./lib/render-html-middleware')
  var sparqlProxy = require('./lib/sparql-proxy')
  var sparqlSearch = require('./lib/sparql-search')

  global.log = bunyan.createLogger({
    name: config.app,
    level: config.logger.level
  })

  config.init = config.init || function () {
    return Promise.resolve()
  }

  return config.init().then(function () {
    var app = express()
    var handler = new config.HandlerClass(config.handlerOptions)

    if (config.expressSettings) {
      for (var key in config.expressSettings) {
        app.set(key, config.expressSettings[key])
      }
    }

    app.use(morgan('combined'))
    app.use(patchHeadersMiddleware(config.patchHeaders))
    app.use(bodyParser.text())
    app.use(bodyParser.urlencoded({extended: false}))

    // instance files
    if (__dirname !== process.cwd()) {
      app.use(express.static(path.join(process.cwd(), './data/public/')))
    }

    // trifid files
    app.use(express.static(path.join(__dirname, './data/public/')))

    // yasgui files
    app.use('/sparql/dist/', express.static(path.resolve(require.resolve('yasgui'), '../../dist/')))

    app.use(absoluteUrl())

    if (config.sparqlProxy) {
      app.use(config.sparqlProxy.path, sparqlProxy(config.sparqlProxy.options))
    }

    if (config.sparqlSearch) {
      app.use(config.sparqlSearch.path, sparqlSearch(config.sparqlSearch.options))
    }

    app.use(renderHtmlMiddleware(handler))
    app.use(handlerMiddleware(handler))
    app.listen(config.listener.port, config.listener.hostname)

    log.info('listening on hostname:port: ' + config.listener.hostname + ':' + config.listener.port)
  }).catch(function (error) {
    console.error(error.stack)
  })
}
