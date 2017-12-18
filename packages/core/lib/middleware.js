const sortBy = require('lodash/sortBy')
const values = require('lodash/values')
const vhost = require('vhost')

function mount (router, config, callback) {
  if (!config || !callback) {
    return Promise.resolve()
  }

  return Promise.resolve().then(() => {
    return callback(config)
  }).then((middleware) => {
    const urlPath = config.path || '/'

    if (config.hostname) {
      router.use(urlPath, vhost(config.hostname, middleware))
    } else {
      router.use(urlPath, middleware)
    }
  })
}

function mountAll (router, configs, callback) {
  configs = configs || {}

  return Promise.all(sortBy(values(configs), 'priority').map((config) => {
    return mount(router, config, callback)
  }))
}

module.exports = {
  mount,
  mountAll
}
