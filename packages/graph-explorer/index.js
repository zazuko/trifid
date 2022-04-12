const absoluteUrl = require('absolute-url')
const express = require('express')
const path = require('path')

function middleware (options) {
  const router = express.Router()

  if (!options || !options.endpointUrl) {
    return router
  }

  options.template = options.template || path.join(__dirname, 'views/index.html')
  options.acceptBlankNodes = !!options.acceptBlankNodes
  options.dataLabelProperty = options.dataLabelProperty || 'rdfs:label'
  options.schemaLabelProperty = options.schemaLabelProperty || 'rdfs:label'
  options.language = options.language || 'en'
  options.languages = options.languages || [
    { code: 'en', label: 'English' },
    { code: 'de', label: 'German' },
    { code: 'fr', label: 'French' },
    { code: 'it', label: 'Italian' }
  ]

  // render index page
  router.get('/', (req, res) => {
    absoluteUrl.attach(req)

    const urlPathname = new URL(req.originalUrl, req.absoluteUrl()).pathname

    // redirect to trailing slash URL for relative pathes of JS and CSS files
    if (urlPathname.slice(-1) !== '/') {
      return res.redirect(urlPathname + '/')
    }

    // read SPARQL endpoint URL from options and resolve with absoluteUrl
    res.locals.endpointUrl = new URL(options.endpointUrl, req.absoluteUrl()).href
    res.locals.acceptBlankNodes = options.acceptBlankNodes
    res.locals.dataLabelProperty = options.dataLabelProperty
    res.locals.schemaLabelProperty = options.schemaLabelProperty
    res.locals.language = options.language
    res.locals.languages = JSON.stringify(options.languages)

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
