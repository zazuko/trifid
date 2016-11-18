var baseConfig = require('./config.fuseki')
var defaultsDeep = require('lodash/defaultsDeep')

var config = {
  listener: {
    port: 8080
  },
  handlerOptions: {
    endpointUrl: 'http://localhost:3030/tbbt/sparql'
  }
}

module.exports = defaultsDeep(config, baseConfig)
