#!/usr/bin/env node

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Command } from 'commander'
import trifid from 'trifid-core'

const program = new Command()

const currentDir = dirname(fileURLToPath(import.meta.url))
const sparqlConfigPath = join(currentDir, 'instances', 'docker-sparql', 'config.yaml')
const defaultConfigurationFile = process.env.TRIFID_CONFIG || sparqlConfigPath

program
  .option('-c, --config <path>', 'configuration file', defaultConfigurationFile)
  .option('-p, --port <port>', 'listener port', parseInt)
  .option('--sparql-endpoint-url <url>', 'SPARQL endpoint URL')
  .option(
    '--dataset-base-url <url>',
    'the base URL of the dataset to enable rewriting',
  )
  .parse(process.argv)

const opts = program.opts()
const configFile = (opts.config && !opts.config.startsWith('/'))
  ? join(process.cwd(), opts.config)
  : opts.config

// create a minimal configuration that extends the specified one
const config = {
  extends: [configFile],
  globals: {},
  server: {
    listener: {},
  },
}

// add optional arguments to the configuration
if (opts.port) {
  config.server.listener.port = opts.port
}
if (opts.sparqlEndpointUrl) {
  config.globals.sparqlEndpoint = {
    url: opts.sparqlEndpointUrl,
  }
  process.env.SPARQL_ENDPOINT_URL = opts.sparqlEndpointUrl
}
if (opts.datasetBaseUrl) {
  config.globals.datasetBaseUrl = opts.datasetBaseUrl
  process.env.DATASET_BASE_URL = opts.datasetBaseUrl
}

// load the configuration and start the server
const instance = await trifid(config)
instance.start()
