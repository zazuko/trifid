#!/usr/bin/env node

const debug = require('debug')('trifid:')
const path = require('path')
const program = require('commander')
const ConfigHandler = require('trifid-core/lib/ConfigHandler')
const Trifid = require('trifid-core')

program
  .option('-v, --verbose', 'verbose output', () => true)
  .option('-c, --config <path>', 'configuration file', process.env.TRIFID_CONFIG)
  .option('-p, --port <port>', 'listener port', parseInt)
  .option('--sparql-endpoint-url <url>', 'URL of the SPARQL HTTP query interface')
  .option('--dataset-base-url <url>', 'Base URL of the dataset')
  .parse(process.argv)

const opts = program.opts()

// automatically switch to config-sparql if a SPARQL endpoint URL is given and no config file was defined
if (opts.sparqlEndpointUrl && !opts.config) {
  opts.config = 'config-sparql.json'
} else if (!opts.config) {
  opts.config = 'config.json'
}

// create a minimal configuration with a baseConfig pointing to the given config file
const config = {
  baseConfig: path.join(process.cwd(), opts.config)
}

console.log('config', config)

// add optional arguments to the configuration

if (opts.port) {
  config.listener = {
    port: opts.port
  }
}

if (opts.sparqlEndpointUrl) {
  config.sparqlEndpointUrl = opts.sparqlEndpointUrl
}

if (opts.datasetBaseUrl) {
  config.datasetBaseUrl = opts.datasetBaseUrl
}

// load the configuration and start the server

const trifid = new Trifid()

trifid.configHandler.resolver.use('trifid', ConfigHandler.pathResolver(__dirname))

trifid.init(config).then(() => {
  if (opts.verbose) {
    debug('expanded config:')
    debug(JSON.stringify(trifid.config, null, ' '))
  }

  return trifid.app()
}).catch((err) => {
  debug(err)
})
