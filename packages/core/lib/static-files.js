var express = require('express')
var mount = require('./mount-middleware')

function mountStaticFiles (router, options) {
  return mount.all(router, options, function (config) {
    return express.static(config.folder)
  })
}

module.exports = mountStaticFiles
