import absoluteUrl from 'absolute-url'
import url from 'url'

const factory = (trifid) => {
  const { logger } = trifid

  return (req, res, next) => {
    absoluteUrl.attach(req)

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
