#!/usr/bin/env node

var configTools = require('./lib/config')
var path = require('path')
var program = require('commander')

program
  .option('-c, --config <path>', 'configuration file', 'config.json')
  .parse(process.argv)

configTools.fromFile(path.join(process.cwd(), program.config)).then(function (config) {
  require('.')(config)
}).catch(function (err) {
  console.error(err.stack || err.message)
})
