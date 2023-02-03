import cookieParser from 'cookie-parser'
import i18n from 'i18n'
import express from 'express'

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

export const middleware = (config) => {
  config = { ...defaults, ...config }

  const middlewareRouter = express.Router()

  i18nConfigure(config)

  middlewareRouter.use(cookieParser(), i18nInit, (req, res, next) => {
    if (req.cookies.i18n !== res.locals.locale) {
      res.cookie(config.cookie, res.locals.locale, { maxAge: config.cookieMaxAge })
    }

    next()
  })

  return middlewareRouter
}

const factory = (trifid) => {
  const { config } = trifid

  // Force user to define the `directory` parameter
  if (!config.directory || typeof config.directory !== 'string') {
    throw new Error("The 'directory' configuration field should be a non-empty string.")
  }

  return middleware(config)
}

export default factory
