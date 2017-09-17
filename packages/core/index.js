/* global log */

'use strict'

var absoluteUrl = require('absolute-url')
var bunyan = require('bunyan')
var configTools = require('./lib/config')
var errorHandler = require('./lib/error-handler')
var express = require('express')
var formatToAccept = require('format-to-accept')
var handlerMiddleware = require('./lib/handler')
var headersFix = require('./lib/headers-fix')
var i18n = require('./lib/i18n')
var redirects = require('./lib/redirects')
var rewrite = require('camouflage-rewrite')
var patchHeaders = require('patch-headers')
var merge = require('lodash/merge')
var morgan = require('morgan')
var plugins = require('./lib/plugins')
var renderer = require('./lib/renderer')
var sparqlProxy = require('./lib/sparql-proxy')
var staticFiles = require('./lib/static-files')
var templateEngine = require('./lib/template-engine')
var yasgui = require('./lib/yasgui')

/**
 * Creates a Trifid middleware
 * @param config
 * @returns Promise
 */
function middleware (config) {
  return configTools.breakDown(config).then(function (config) {
    var router = express.Router()

    router.locals = {
      config: config,
      t: function (x) { return x.substring(x.indexOf(':') + 1) }
    }

    var pluginList = [{
      name: 'core:logger',
      func: plugins.middleware,
      middleware: morgan,
      params: ['combined']
    }, {
      name: 'core:absoluteUrl',
      func: plugins.middleware,
      middleware: absoluteUrl
    }, {
      name: 'patchHeaders',
      func: plugins.middleware,
      middleware: patchHeaders
    }, {
      name: 'redirects',
      func: redirects
    }, {
      name: 'sparqlProxy',
      func: sparqlProxy
    }, {
      name: 'i18n',
      func: i18n
    }, {
      name: 'locals',
      func: templateEngine.locals
    }, {
      name: 'staticViews',
      func: templateEngine.staticViews
    }, {
      name: 'staticFiles',
      func: staticFiles
    }, {
      name: 'mediaTypeUrl',
      func: plugins.middleware,
      middleware: formatToAccept
    }, {
      name: 'yasgui',
      func: yasgui
    }, {
      name: 'rewrite',
      func: plugins.middleware,
      middleware: rewrite
    }, {
      name: 'renderers',
      func: renderer.all
    }, {
      name: 'renderer',
      func: renderer
    }, {
      name: 'handler',
      func: plugins.middleware,
      middleware: handlerMiddleware
    }, {
      name: 'headers-fix',
      func: headersFix
    }, {
      name: 'error-handler',
      func: errorHandler
    }]

    return plugins.load(pluginList, router, config).then(function () {
      return router
    })
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
