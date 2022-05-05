import Promise from 'bluebird'
import sortBy from 'lodash/sortBy.js'
import values from 'lodash/values.js'
import vhost from 'vhost'

function mount (router, config, callback) {
  return Promise.resolve().then(() => {
    return callback(config)
  }).then(middleware => {
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

  return Promise.each(sortBy(values(configs), 'priority').filter(config => config), config => {
    return mount(router, config, callback)
  })
}

export default {
  mount,
  mountAll
}
