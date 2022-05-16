import absoluteUrl from 'absolute-url'

const removeSearchParams = (originalUrl) => {
  const url = new URL(originalUrl)
  return `${url.origin}${url.pathname}`
}

const iri = (router) => {
  router.use((req, res, next) => {
    absoluteUrl.attach(req)

    req.iri = decodeURI(removeSearchParams(req.absoluteUrl()))

    next()
  })
}

export default iri
