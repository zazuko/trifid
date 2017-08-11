'use strict'

var express = require('express')
var path = require('path')
var url = require('url')

function factory (options) {
  var router = express.Router()

  if (!options || !options.endpointUrl) {
    return router
  }

  options.template = options.template || path.join(__dirname, 'views/index.html')

  // render index page
  router.get('/', function (req, res) {
    var urlPathname = url.parse(req.originalUrl).pathname

    // redirect to trailing slash URL for relative pathes of JS and CSS files
    if (urlPathname.slice(-1) !== '/') {
      return res.redirect(urlPathname + '/')
    }

    // read SPARQL endpoint URL from options and resolve with absoluteUrl
    res.locals.endpointUrl = url.resolve(req.absoluteUrl(), options.endpointUrl)

    res.render(options.template)
  })

  // static files from yasgui dist folder
  router.use('/dist/', express.static(path.resolve(require.resolve('yasgui'), '../../dist/')))

  return router
}

module.exports = factory
