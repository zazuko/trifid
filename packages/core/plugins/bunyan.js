const bunyan = require('bunyan')

function init (router, options) {
  global.log = bunyan.createLogger({
    name: options.app,
    level: options.level
  })
}

module.exports = init
