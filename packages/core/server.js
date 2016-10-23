#!/usr/bin/env node

var path = require('path')

var config

try {
  console.log(path.join(process.cwd(), 'config'))
  config = require(path.join(process.cwd(), 'config'))
} catch (err) {
  config = require('./config')
}

require('.')(config)
