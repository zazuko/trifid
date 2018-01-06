const clone = require('lodash/clone')
const get = require('lodash/get')
const merge = require('lodash/merge')
const path = require('path')
const set = require('lodash/set')
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

  breakDownRule (config, property, value) {
    const currentValue = get(config, property)

    // don't overwrite existing values
    if (currentValue !== undefined && currentValue !== null) {
      return
    }

    if (Array.isArray(value)) {
      // find first value for the given strings which is not undefined and assign it
      set(config, property, value.reduce((actual, value) => {
        if (actual !== undefined) {
          return actual
        }

        return get(config, value)
      }, undefined))
    } else if (typeof value === 'object') {
      // assigned clone of the object
      set(config, property, clone(value))
    } else if (typeof value === 'string') {
      // find the value for the given string and assign it
      set(config, property, get(config, value))
    }
  }

  breakDown () {
    if (!this.config.breakDown) {
      return Promise.resolve(this.config)
    }

    // read and process all rules from config.breakDown
    Object.keys(this.config.breakDown).forEach((property) => {
      this.breakDownRule(this.config, property, this.config.breakDown[property])
    })

    return Promise.resolve(this.config)
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
