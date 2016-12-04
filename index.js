/* global log */

'use strict'

var absoluteUrl = require('absolute-url')
var bodyParser = require('body-parser')
var configTools = require('./lib/config')
var express = require('express')
var handlerMiddleware = require('./lib/handler-middleware')
var rewrite = require('camouflage-rewrite')
var patchHeaders = require('patch-headers')
var morgan = require('morgan')
var path = require('path')
var bunyan = require('bunyan')
var htmlRenderer = require('./lib/render-html-middleware')
var sparqlProxy = require('./lib/sparql-proxy')

/**
 * Creates a Trifid middleware
 * @param config
 * @returns Promise
 */
function middleware (config) {
  return configTools.breakDown(config).then(function (config) {
    var router = express.Router()

    router.use(morgan('combined'))
    router.use(absoluteUrl())
    router.use(rewrite(config.rewrite))
    router.use(patchHeaders(config.patchHeaders))
    router.use(bodyParser.text())
    router.use(bodyParser.urlencoded({extended: false}))

    // instance files
    if (__dirname !== process.cwd()) {
      router.use(express.static(path.join(process.cwd(), './data/public/')))
    }

    // trifid files
    router.use(express.static(path.join(__dirname, './data/public/')))

    // yasgui files
    router.use('/sparql/dist/', express.static(path.resolve(require.resolve('yasgui'), '../../dist/')))

    if (config.sparqlProxy) {
      router.use(config.sparqlProxy.path, sparqlProxy(config.sparqlProxy.options))
    }

    router.use(htmlRenderer(config.htmlRenderer))
    router.use(handlerMiddleware(config.handler))

    return router
  })
}

/**
 * Starts a Trifid instance
 * @param config
 * @returns Promise
 */
function trifid (config) {
  global.log = bunyan.createLogger({
    name: config.logger.app,
    level: config.logger.level
  })

  var app = express()

  if (config.express) {
    Object.keys(config.express).forEach(function (key) {
      app.set(key, config.express[key])
    })
  }

  return middleware(config).then(function (router) {
    app.use(router)

    app.listen(config.listener.port, config.listener.host)

    log.info('listening on hostname:port: ' + config.listener.hostname + ':' + config.listener.port)
  })
}

trifid.middleware = middleware

module.exports = trifid
