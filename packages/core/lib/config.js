var path = require('path')
var merge = require('lodash/merge')
var shortstop = require('shortstop')
var shush = require('shush')

/**
 * Breaks down generic options to the module configurations
 * @param config
 */
function breakDown (config) {
  config.handler.options = config.handler.options || {}
  config.handler.options.endpointUrl = config.handler.options.endpointUrl || config.sparqlEndpointUrl

  config.rewrite = config.rewrite || {}
  config.rewrite.url = config.rewrite.url || config.datasetBaseUrl

  return Promise.resolve(config)
}

/**
 * Loads a configuration and all dependencies from a JSON file
 * @param filename
 * @returns {*}
 */
function fromFile (filename) {
  return resolve(shush(filename)).then(function (config) {
    if (!config.baseConfig) {
      return config
    }

    return fromFile(config.baseConfig).then(function (baseConfig) {
      return merge(baseConfig, config)
    })
  })
}

/**
 * Shortstop handler to resolve pathes
 * @param base base path should be set using .bind(null, base)
 * @param value
 * @returns {*}
 */
function resolvePath (base, value) {
  if (path.resolve(value) === value) {
    return value
  }

  return path.join(base, value)
}

/**
 * Resolves all shortstop values of a configuration
 * @param config
 * @returns {Promise}
 */
function resolve (config) {
  var resolver = shortstop.create()

  resolver.use('cwd', resolvePath.bind(null, process.cwd()))
  resolver.use('trifid', resolvePath.bind(null, path.resolve(__dirname, '..')))

  return new Promise(function (resolve, reject) {
    resolver.resolve(config, function (err, resolved) {
      if (err) {
        reject(err)
      } else {
        resolve(resolved)
      }
    })
  })
}

module.exports = {
  breakDown: breakDown,
  fromFile: fromFile,
  resolve: resolve
}
