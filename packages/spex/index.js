const absoluteUrl = require('absolute-url')
const express = require('express')
const path = require('path')
const url = require('url')

const defaults = {
  template: path.join(__dirname, 'views/index.html')
}

const defaultOptions = {
  url: null,
  user: null,
  password: null,
  graph: null,
  prefixes: [],
  forceIntrospection: false
}

function middleware (config) {
  const router = express.Router()

  const options = { ...defaultOptions, ...(config.options || {}) }
  config = { ...defaults, ...config, options }

  // render index page
  router.get('/', (req, res) => {
    absoluteUrl.attach(req)

    // Create an absolute URL if a relative URL is provided
    options.url = (new url.URL(options.url, req.absoluteUrl())).toString()

    res.locals.options = JSON.stringify(options)

    res.render(config.template)
  })

  // static files from spex dist folder
  router.use('/static/', express.static(path.resolve(require.resolve('@zazuko/spex'), '../../dist/')))

  return router
}

function factory (router, configs) {
  return this.middleware.mountAll(router, configs, (config) => {
    return middleware(config)
  })
}

module.exports = factory
