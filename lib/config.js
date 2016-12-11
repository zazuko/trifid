var get = require('lodash/get')
var path = require('path')
var merge = require('lodash/merge')
var set = require('lodash/set')
var shortstop = require('shortstop')
var shush = require('shush')

var breakDownRules = {
  'handler.options': {},
  'handler.options.endpointUrl': 'sparqlEndpointUrl',
  'rewrite': {},
  'rewrite.url': 'datasetBaseUrl',
  'yasgui.options': {},
  'yasgui.options.endpointUrl': [
    'sparqlProxy.path',
    'sparqlEndpointUrl'
  ]
}

function breakDownRule (config, property, value) {
  if (get(config, property)) {
    return
  }

  if (Array.isArray(value)) {
    set(config, property, value.reduce(function (actual, value) {
      return actual || get(config, value)
    }, null))
  } else if (typeof value === 'object') {
    set(config, property, value)
  } else if (typeof value === 'string') {
    set(config, property, get(config, value))
  }
}

/**
 * Breaks down generic options to the module configurations
 * @param config
 */
function breakDown (config) {
  Object.keys(breakDownRules).forEach(function (property) {
    breakDownRule(config, property, breakDownRules[property])
  })

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
