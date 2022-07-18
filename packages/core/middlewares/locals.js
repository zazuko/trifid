import absoluteUrl from 'absolute-url'
import url from 'url'

function factory (trifid) {

  return (req, res, next) => {

    absoluteUrl.attach(req)

    // requested resource
    res.locals.iri = req.iri

    // requested resource parsed into URL object
    res.locals.url = new url.URL(res.locals.iri)

    // dummy translation
    res.locals.t = res.locals.t || (x => {
      return x.substring(x.indexOf(':') + 1)
    })
    next()
  }

}

export default factory
