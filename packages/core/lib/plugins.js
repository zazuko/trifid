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
  var middleware

  if (plugin.params) {
    middleware = plugin.middleware.apply(null, plugin.params)
  } else {
    middleware = plugin.middleware.call(null, config)
  }

  router.use(middleware)
}

module.exports = plugins
