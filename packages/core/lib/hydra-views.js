var hydraView = require('hydra-view')
var mount = require('./mount-middleware')

function factory (router, options) {
  return mount.all(router, options, function (config) {
    return hydraView.fromJsonLdFile(config.documentationUrl, config.documentation, config.options)
  })
}

module.exports = factory
