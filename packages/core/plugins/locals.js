const absoluteUrl = require('absolute-url')
const url = require('url')

/**
 * Adds router and request locals variables
 * @param router
 */
function locals (router) {
  router.use((req, res, next) => {
    absoluteUrl.attach(req)

    // requested resource
    res.locals.iri = req.iri

    // requested resource parsed into URL object
    res.locals.url = url.parse(res.locals.iri)

    // dummy translation
    res.locals.t = res.locals.t || ((x) => {
      return x.substring(x.indexOf(':') + 1)
    })

    next()
  })
}

module.exports = locals
