import absoluteUrl from 'absolute-url'
import express from 'express'

import url from 'url'

const createMiddleWare = (options) => {
  const router = express.Router()

  if (!options || !options.endpointUrl) {
    return router
  }

  const templatePath = new URL('views/index.html', import.meta.url).pathname
  options.template = options.template || templatePath

  const yasguiPath = new URL('node_modules/yasgui/dist/', import.meta.url).pathname
  router.use('/dist/', express.static(yasguiPath))

  // render index page
  router.get('/', (req, res) => {
    absoluteUrl.attach(req)

    const urlPathname = url.parse(req.originalUrl).pathname // eslint-disable-line

    // redirect to trailing slash URL for relative pathes of JS and CSS files
    if (urlPathname.slice(-1) !== '/') {
      return res.redirect(urlPathname + '/')
    }

    // read SPARQL endpoint URL from options and resolve with absoluteUrl
    res.locals.endpointUrl = url.resolve(req.absoluteUrl(), options.endpointUrl) // eslint-disable-line
    res.locals.urlShortener = options.urlShortener

    res.render(options.template)
  })

  return router
}

const trifidFactory = (trifid) => {
  const { config } = trifid

  return createMiddleWare(config)
}

export default trifidFactory
export { createMiddleWare }
