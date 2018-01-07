const absoluteUrl = require('absolute-url')
const path = require('path')
const url = require('url')

function removeUrlPart (originalUrl, part) {
  const parts = url.parse(originalUrl)

  parts[part] = null

  return url.format(parts)
}

function handler (router, options) {
  this.middleware.mountAll(router, options, (options) => {
    console.log(' mount handler: ' + path.basename(options.module) + ' ' + JSON.stringify(options.options))

    const Handler = this.moduleLoader.require(options.module)
    const instance = new Handler(options.options)

    return (req, res, next) => {
      absoluteUrl.attach(req)

      req.iri = decodeURI(removeUrlPart(req.absoluteUrl(), 'search'))

      instance.handle(req, res, next)
    }
  })
}

module.exports = handler
