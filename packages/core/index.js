const express = require('express')
const debug = require('debug')('trifid')
const middleware = require('./lib/middleware')
const moduleLoader = require('./lib/module-loader')
const plugins = require('./lib/plugins')
const ConfigHandler = require('./lib/ConfigHandler')

class Trifid {
  constructor () {
    this.configHandler = new ConfigHandler()

    this.configHandler.resolver.use('cwd', ConfigHandler.pathResolver(process.cwd()))
    this.configHandler.resolver.use('env', (variable) => {
      return process.env[variable] || ''
    })
    this.configHandler.resolver.use('trifid-core', ConfigHandler.pathResolver(__dirname))

    this.config = this.configHandler.config

    this.context = {
      config: this.config,
      configHandler: this.configHandler,
      middleware,
      moduleLoader
    }
  }

  init (config) {
    return Promise.resolve().then(() => {
      if (typeof config === 'string') {
        return this.context.configHandler.fromFile(config)
      } else {
        return this.context.configHandler.fromJson(config)
      }
    }).then(() => {
      return this.context.configHandler.breakDown()
    })
  }

  middleware (router) {
    router = router || express.Router()

    router.locals = {
      config: this.config
    }

    return plugins.load(this.config.plugins, router, this.config, this.context).then(() => {
      return router
    })
  }

  app () {
    const app = express()

    if (this.config.express) {
      Object.keys(this.config.express).forEach((key) => {
        app.set(key, this.config.express[key])
      })
    }

    return this.middleware(app).then(() => {
      app.listen(this.config.listener.port, this.config.listener.host)
      debug('listening on: %s:%d', (this.config.listener.host || '*'), this.config.listener.port)

      return app
    })
  }

  static app (config) {
    return (new Trifid()).init(config).then(trifid => trifid.app())
  }
}

module.exports = Trifid
