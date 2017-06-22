var vhost = require('vhost')

function mount (router, configs, callback) {
  configs = configs || {}

  Object.keys(configs).forEach(function (key) {
    var config = configs[key]

    if (config.hostname) {
      router.use(config.path, vhost(config.hostname, callback(config)))
    } else {
      router.use(config.path, callback(config))
    }
  })
}

module.exports = mount
