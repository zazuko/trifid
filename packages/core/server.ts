#!/usr/bin/env node

import { join } from 'node:path'
import { Command } from 'commander'

import trifid from './index.ts'

import type { TrifidConfigWithExtends } from './types/index.ts'

const program = new Command()

program
  .option('-c, --config <path>', 'configuration file', 'config.yaml')
  .option('-p, --port <port>', 'listener port', parseInt)
  .parse(process.argv)

const opts = program.opts()
const configFile = join(process.cwd(), opts.config)

// Create a minimal configuration that extends the specified one
// (adding the optional listener port when provided on the command line)
const config: TrifidConfigWithExtends = {
  extends: [configFile],
  server: {
    listener: opts.port ? { port: opts.port } : {},
  },
}

// Load the configuration and start the server
const instance = await trifid(config)
await instance.start()
