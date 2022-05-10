import absoluteUrl from 'absolute-url'
import express from 'express'
import path from 'path'

import { dirname } from 'path'
import url, { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function middleware (options) {
  const router = express.Router()

  if (!options || !options.endpointUrl) {
    return router
  }

  options.template = options.template || path.join(__dirname, 'views/index.html')

  // render index page
  router.get('/', (req, res) => {
    absoluteUrl.attach(req)

    const urlPathname = url.parse(req.originalUrl).pathname

    // redirect to trailing slash URL for relative pathes of JS and CSS files
    if (urlPathname.slice(-1) !== '/') {
      return res.redirect(urlPathname + '/')
    }

    // read SPARQL endpoint URL from options and resolve with absoluteUrl
    res.locals.endpointUrl = url.resolve(req.absoluteUrl(), options.endpointUrl)
    res.locals.urlShortener = options.urlShortener

    res.render(options.template)
  })

  // static files from yasgui dist folder
  router.use('/dist/', express.static(path.resolve(require.resolve('yasgui'), '../../dist/')))

  return router
}

function factory (router, configs) {
  return this.middleware.mountAll(router, configs, (config) => {
    return middleware(config)
  })
}

export default factory
