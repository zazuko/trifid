var sparqlProxy = require('sparql-proxy')

function init (router, config) {
  if (!config || !config.path) {
    return
  }

  // mount proxy always with path and config
  // try config from .options for legacy configs
  router.use(config.path, sparqlProxy(config.options || config))
}

module.exports = init
