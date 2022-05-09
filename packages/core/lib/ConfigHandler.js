import path from 'path'
import cloneDeep from 'lodash/cloneDeep.js'
import get from 'lodash/get.js'
import merge from 'lodash/merge.js'
import set from 'lodash/set.js'
import shortstop from 'shortstop'
import shush from 'shush'

class ConfigHandler {
  constructor () {
    this.config = {}
    this.resolver = shortstop.create()
  }

  static pathResolver (base) {
    return value => {
      if (path.resolve(value) === value) {
        return value
      }
      return path.join(base, value)
    }
  }

  resolve (config) {
    return new Promise((resolve, reject) => {
      this.resolver.resolve(config, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }

  resolvePath (patname) {
    return this.resolve({ a: patname }).then(result => {
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
      set(config, property, cloneDeep(value))
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
    Object.keys(this.config.breakDown).forEach(property => {
      this.breakDownRule(this.config, property, this.config.breakDown[property])
    })

    return Promise.resolve(this.config)
  }

  configFromFile (filename) {
    return this.resolve(shush(filename)).then(config => {
      if (!config.baseConfig) {
        return config
      }

      return this.configFromFile(config.baseConfig).then(baseConfig => {
        return merge(baseConfig, config)
      })
    })
  }

  fromFile (filename) {
    return this.configFromFile(filename).then(config => {
      return merge(this.config, config)
    })
  }

  fromJson (config) {
    return this.resolve(cloneDeep(config)).then(resolved => {
      if (!resolved.baseConfig) {
        return resolved
      }

      return this.configFromFile(resolved.baseConfig).then(baseConfig => {
        return merge(baseConfig, config)
      })
    }).then(processed => {
      return merge(this.config, processed)
    })
  }
}

export default ConfigHandler
