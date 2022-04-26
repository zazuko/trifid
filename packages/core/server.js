#!/usr/bin/env node

const path = require('path')
const program = require('commander')
const Trifid = require('.')

program
  .option('-c, --config <path>', 'configuration file', 'config.json')
  .option('-p, --port <port>', 'listener port', parseInt)
  .parse(process.argv)

// create a minimal configuration with a baseConfig pointing to the given config file
const config = {
  baseConfig: path.join(process.cwd(), program.config)
}

// add optional arguments to the configuration

if (program.port) {
  config.listener = {
    port: program.port
  }
}

// load the configuration and start the server
Trifid.app(config).catch(err => {
  console.error(err.stack || err.message)
})
