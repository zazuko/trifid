var i18next = require('i18next')
var i18nextMiddleware = require('i18next-express-middleware')

function init (router, options) {
  if (!options) {
    return
  }

  var i18nextBackend = require(options.backend.module || 'i18next-node-fs-backend')

  i18next.use(i18nextMiddleware.LanguageDetector).use(i18nextBackend).init(options)

  router.use(i18nextMiddleware.handle(i18next))
}

module.exports = init
