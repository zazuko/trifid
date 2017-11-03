var hydraView = require('hydra-view')
var mount = require('./mount-middleware')

function factory (router, options) {
  return mount.all(router, options, function (config) {
    if (config.documentation.indexOf('://') === -1) {
      config.documentation = 'file://' + config.documentation
    }

    return hydraView.fromUrl(config.documentationUrl, config.documentation, config.options)
  })
}

module.exports = factory
