#!/usr/bin/env node

var path = require('path')

var config

try {
  config = require(path.join(process.cwd(), 'config'))
} catch (err) {
  config = require('./config')
}

require('.')(config)
