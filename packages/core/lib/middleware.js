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

async function mountAll (router, configs, callback) {
  configs = configs || {}

  const mappedConfig = []
  for (const config of sortBy(values(configs), 'priority')) {
    mappedConfig.push(await mount(router, config, callback))
  }
  return mappedConfig
}

export default {
  mount,
  mountAll
}
