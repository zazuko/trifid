var bodyParser = require('body-parser')
var sparqlProxy = require('sparql-proxy')

function init (router, config) {
  if (!config || !config.path) {
    return
  }

  router.use(bodyParser.text())
  router.use(bodyParser.urlencoded({extended: false}))
  router.use(config.path, sparqlProxy(config.options))
}

module.exports = init
