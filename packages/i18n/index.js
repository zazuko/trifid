import cookieParser from 'cookie-parser'
import i18n from 'i18n'

const { configure: i18nConfigure, init: i18nInit } = i18n

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

  i18nConfigure(config)

  router.use(cookieParser(), i18nInit, (req, res, next) => {
    if (req.cookies.i18n !== res.locals.locale) {
      res.cookie(config.cookie, res.locals.locale, { maxAge: config.cookieMaxAge })
    }

    next()
  })
}

export default init
