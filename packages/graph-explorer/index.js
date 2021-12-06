const absoluteUrl = require('absolute-url')
const express = require('express')
const path = require('path')

function middleware (options) {
  const router = express.Router()

  if (!options || !options.endpointUrl) {
    return router
  }

  options.template = options.template || path.join(__dirname, 'views/index.html')

  // render index page
  router.get('/', (req, res) => {
    absoluteUrl.attach(req)

    const urlPathname = new URL(req.originalUrl).pathname

    // redirect to trailing slash URL for relative pathes of JS and CSS files
    if (urlPathname.slice(-1) !== '/') {
      return res.redirect(urlPathname + '/')
    }

    // read SPARQL endpoint URL from options and resolve with absoluteUrl
    res.locals.endpointUrl = new URL(options.endpointUrl, req.absoluteUrl()).href

    res.render(options.template)
  })

  // static files from yasgui dist folder
  router.use('/dist/', express.static(path.resolve(require.resolve('graph-explorer'), '../../dist/')))

  return router
}

function factory (router, configs) {
  return this.middleware.mountAll(router, configs, (config) => {
    return middleware(config)
  })
}

module.exports = factory
