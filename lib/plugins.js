var Promise = require('bluebird')

var plugins = {}

plugins.load = function (list, router, config) {
  return Promise.mapSeries(list, function (plugin) {
    console.log('loading: ' + plugin.name)

    var params = config[plugin.name]

    return plugin.func(router, params, plugin)
  })
}

plugins.middleware = function (router, config, plugin) {
  if (plugin.params) {
    router.use(plugin.middleware.apply(null, plugin.params))
  } else {
    router.use(plugin.middleware.call(null, config))
  }
}

module.exports = plugins
