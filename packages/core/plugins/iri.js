const url = require('url')
const absoluteUrl = require('absolute-url')

const removeSearchParams = (originalUrl) => {
  const parts = new url.URL(originalUrl)
  parts.searchParams = new URLSearchParams()
  parts.search = ''
  return url.format(parts)
}

const iri = (router) => {
  router.use((req, res, next) => {
    absoluteUrl.attach(req)

    req.iri = decodeURI(removeSearchParams(req.absoluteUrl()))

    next()
  })
}

module.exports = iri
