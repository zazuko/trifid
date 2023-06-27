#!/usr/bin/env node

import { join } from 'path'
import { Command } from 'commander'

import trifid from './index.js'

const program = new Command()

program.option('-c, --config <path>', 'configuration file', 'config.yaml')
  .option('-p, --port <port>', 'listener port', parseInt)
  .parse(process.argv)

const opts = program.opts()
const configFile = join(process.cwd(), opts.config)

// create a minimal configuration that extends the specified one
const config = {
  extends: [
    configFile
  ],
  server: {
    listener: {}
  }
}

// add optional arguments to the configuration
if (opts.port) {
  config.server.listener.port = opts.port
}

// load the configuration and start the server
const instance = await trifid(config)
instance.start()
