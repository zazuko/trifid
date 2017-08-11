var mount = require('./mount-middleware')
var yasgui = require('trifid-yasgui')

function init (router, config) {
  if (config && config.path) {
    return mount(router, config, function () {
      return yasgui(config.options)
    })
  }
}

module.exports = init
