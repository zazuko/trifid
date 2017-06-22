var express = require('express')
var mount = require('./mount-middleware')

function mountStaticFiles (router, options) {
  mount(router, options, function (config) {
    return express.static(config.folder)
  })
}

module.exports = mountStaticFiles
