const url = require('url')

/**
 * Adds router and request locals variables
 * @param router
 */
function locals (router) {
  router.use((req, res, next) => {
    res.locals.iri = req.absoluteUrl()
    res.locals.url = url.parse(res.locals.iri)
    res.locals.t = res.locals.t || ((x) => {
      return x.substring(x.indexOf(':') + 1)
    })

    next()
  })
}

module.exports = locals
