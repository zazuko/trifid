import absoluteUrl from 'absolute-url'
import url from 'url'

const factory = (trifid) => {
  const { logger } = trifid

  const defaultLanguage = 'en'
  const supportedLanguages = [
    'en', 'fr', 'de', 'it'
  ]

  const oneMonthMilliseconds = 60 * 60 * 24 * 30 * 1000

  return (req, res, next) => {
    absoluteUrl.attach(req)

    // export language information for other middlewares
    res.locals.defaultLanguage = defaultLanguage
    res.locals.currentLanguage = req?.cookies?.i18n || defaultLanguage

    // update langage by setting `lang` query parameter
    const lang = req.query.lang
    if (lang && supportedLanguages.includes(lang)) {
      logger.debug(`set default language to '${lang}'`)
      res.cookie('i18n', lang, { maxAge: oneMonthMilliseconds })
      res.locals.currentLanguage = lang
    }

    // requested resource
    res.locals.iri = req.iri

    // requested resource parsed into URL object
    res.locals.url = new url.URL(res.locals.iri)

    // dummy translation
    res.locals.t = res.locals.t || (x => {
      const translation = x.substring(x.indexOf(':') + 1)
      logger.debug(`translation value: ${translation}`)
      return translation
    })
    next()
  }
}

export default factory
