const absoluteUrl = require('absolute-url')
const url = require('url')

function removeUrlPart (originalUrl, part) {
  const parts = url.parse(originalUrl)

  parts[part] = null

  return url.format(parts)
}

function iri (router) {
  router.use((req, res, next) => {
    absoluteUrl.attach(req)

    req.iri = decodeURI(removeUrlPart(req.absoluteUrl(), 'search'))

    next()
  })
}

module.exports = iri
