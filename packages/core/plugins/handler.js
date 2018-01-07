const path = require('path')

function handler (router, options) {
  this.middleware.mountAll(router, options, (options) => {
    console.log(' mount handler: ' + path.basename(options.module) + ' ' + JSON.stringify(options.options))

    const Handler = this.moduleLoader.require(options.module)
    const instance = new Handler(options.options)

    return (req, res, next) => {
      instance.handle(req, res, next)
    }
  })
}

module.exports = handler
