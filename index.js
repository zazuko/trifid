/* global log */

'use strict'

module.exports = function (config) {
  var absoluteUrl = require('absolute-url')
  var bodyParser = require('body-parser')
  var express = require('express')
  var handlerMiddleware = require('./lib/handler-middleware')
  var rewrite = require('camouflage-rewrite')
  var patchHeaders = require('patch-headers')
  var morgan = require('morgan')
  var path = require('path')
  var bunyan = require('bunyan')
  var htmlRenderer = require('./lib/render-html-middleware')
  var sparqlProxy = require('./lib/sparql-proxy')

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
    app.use(absoluteUrl())
    app.use(rewrite(config.rewrite))
    app.use(patchHeaders(config.patchHeaders))
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

    if (config.sparqlProxy) {
      app.use(config.sparqlProxy.path, sparqlProxy(config.sparqlProxy.options))
    }

    app.use(htmlRenderer(config.htmlRenderer))
    app.use(handlerMiddleware(handler))
    app.listen(config.listener.port, config.listener.hostname)

    log.info('listening on hostname:port: ' + config.listener.hostname + ':' + config.listener.port)
  }).catch(function (error) {
    console.error(error.stack)
  })
}
