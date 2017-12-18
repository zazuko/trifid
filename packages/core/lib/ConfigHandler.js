const clone = require('lodash/clone')
const merge = require('lodash/merge')
const path = require('path')
const shortstop = require('shortstop')
const shush = require('shush')
const Promise = require('bluebird')

class ConfigHandler {
  constructor () {
    this.config = {}

    this.resolver = shortstop.create()
  }

  resolve (config) {
    return Promise.promisify(this.resolver.resolve.bind(this.resolver))(config)
  }

  resolvePath (patname) {
    return this.resolve({a: patname}).then((result) => {
      return result.a
    })
  }

  configFromFile (filename) {
    return this.resolve(shush(filename)).then((config) => {
      if (!config.baseConfig) {
        return config
      }

      return this.fromFile(config.baseConfig).then((baseConfig) => {
        return merge(baseConfig, config)
      })
    })
  }

  fromFile (filename) {
    return this.configFromFile(filename).then((config) => {
      merge(this.config, config)
    })
  }

  fromJson (config) {
    if (!config.baseConfig) {
      return Promise.resolve(config)
    }

    return this.resolve(clone(config)).then((resolved) => {
      return this.configFromFile(resolved.baseConfig)
    }).then((baseConfig) => {
      return merge(this.config, merge(baseConfig, config))
    })
  }

  static pathResolver (base) {
    return (value) => {
      if (path.resolve(value) === value) {
        return value
      }

      return path.join(base, value)
    }
  }
}

module.exports = ConfigHandler
