#!/usr/bin/env node

import { join } from 'node:path'
import { Command } from 'commander'

import trifid from './index.js'

const program = new Command()

program
  .option('-c, --config <path>', 'configuration file', 'config.yaml')
  .option('-p, --port <port>', 'listener port', parseInt)
  .parse(process.argv)

const opts = program.opts()
const configFile = join(process.cwd(), opts.config)

// Create a minimal configuration that extends the specified one
const config = {
  extends: [configFile],
  server: {
    listener: {},
  },
}

// Add optional arguments to the configuration
if (opts.port) {
  config.server.listener.port = opts.port
}

// Load the configuration and start the server
const instance = await trifid(config)
await instance.start()
