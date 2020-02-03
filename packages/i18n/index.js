const i18n = require('i18n')
const cookieParser = require('cookie-parser')

const defaults = {
  cookie: 'i18n',
  queryParameter: 'lang',
  directory: 'locales',
  api: {
    __: 't',
    __n: 'tn'
  },
  cookieMaxAge: 30 * 24 * 60 * 60 * 1000
}

function init (router, config) {
  config = { ...defaults, ...config }

  i18n.configure(config)

  router.use(cookieParser(), i18n.init, (req, res, next) => {
    if (req.cookies.i18n !== res.locals.locale) {
      res.cookie(config.cookie, res.locals.locale, { maxAge: config.cookieMaxAge })
    }

    next()
  })
}

module.exports = init
