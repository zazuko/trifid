#!/usr/bin/env node

const path = require('path')
const program = require('commander')
const Trifid = require('.')

program
  .option('-c, --config <path>', 'configuration file', 'config.json')
  .option('-p, --port <port>', 'listener port', parseInt)
  .parse(process.argv)

const opts = program.opts()

// create a minimal configuration with a baseConfig pointing to the given config file
const config = {
  baseConfig: path.join(process.cwd(), opts.config)
}

// add optional arguments to the configuration

if (opts.port) {
  config.listener = {
    port: opts.port
  }
}

// load the configuration and start the server
Trifid.app(config).catch(err => {
  console.error(err.stack || err.message)
})
