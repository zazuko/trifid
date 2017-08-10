/* global log */

'use strict'

var absoluteUrl = require('absolute-url')
var bodyParser = require('body-parser')
var configTools = require('./lib/config')
var express = require('express')
var formatToAccept = require('format-to-accept')
var handlerMiddleware = require('./lib/handler-middleware')
var i18n = require('./lib/i18n')
var redirects = require('./lib/redirects')
var rewrite = require('camouflage-rewrite')
var patchHeaders = require('patch-headers')
var merge = require('lodash/merge')
var morgan = require('morgan')
var bunyan = require('bunyan')
var renderer = require('./lib/render-middleware')
var sparqlProxy = require('sparql-proxy')
var staticFiles = require('./lib/static-files')
var templateEngine = require('./lib/template-engine')
var yasgui = require('trifid-yasgui')

/**
 * Creates a Trifid middleware
 * @param config
 * @returns Promise
 */
function middleware (config) {
  return configTools.breakDown(config).then(function (config) {
    var router = express.Router()

    router.locals = {
      config: config
    }

    router.use(morgan('combined'))
    router.use(absoluteUrl())
    router.use(patchHeaders(config.patchHeaders))

    // redirects
    redirects(router, config.redirects)

    // i18n
    i18n(router, config.i18n)

    // locals
    templateEngine.locals(router)

    // static views
    templateEngine.staticViews(router, config.staticViews)

    // static file hosting
    staticFiles(router, config.staticFiles)

   // add media type URL request support (?format=)
    router.use(formatToAccept(config.mediaTypeUrl))

    // SPARQL proxy
    if (config.sparqlProxy && config.sparqlProxy.path) {
      router.use(bodyParser.text())
      router.use(bodyParser.urlencoded({extended: false}))
      router.use(config.sparqlProxy.path, sparqlProxy(config.sparqlProxy.options))
    }

    // yasgui
    if (config.yasgui && config.yasgui.path) {
      router.use(config.yasgui.path, yasgui(config.yasgui.options))
    }

    router.use(rewrite(config.rewrite))
    router.use(renderer(config.renderer))
    router.use(handlerMiddleware(config.handler))

    // workaround for missing headers after hijack
    router.use(function (err, req, res, next) {
      res._headers = res._headers || {}

      next(err)
    })

    // default error handler -> send no content
    router.use(function (err, req, res, next) {
      console.error(err.stack || err.message)

      res.statusCode = err.statusCode || 500
      res.end()
    })

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
    merge(app.locals, router.locals)

    templateEngine(app)

    app.use(router)

    app.listen(config.listener.port, config.listener.host)

    log.info('listening on hostname:port: ' + config.listener.host + ':' + config.listener.port)
  })
}

trifid.middleware = middleware

module.exports = trifid
