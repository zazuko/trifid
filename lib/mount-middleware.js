var vhost = require('vhost')

function mount (router, config, callback) {
  if (!config || !callback) {
    return Promise.resolve()
  }

  return Promise.resolve().then(function () {
    return callback(config)
  }).then(function (middleware) {
    var urlPath = config.path || '/'

    if (config.hostname) {
      router.use(urlPath, vhost(config.hostname, middleware))
    } else {
      router.use(urlPath, middleware)
    }
  })
}

mount.all = function (router, configs, callback) {
  configs = configs || {}

  return Promise.all(Object.keys(configs).map(function (key) {
    return mount(router, configs[key], callback)
  }))
}

module.exports = mount
