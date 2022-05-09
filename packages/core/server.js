import { join, dirname } from 'path'
import { Command } from 'commander'
import { fileURLToPath } from 'url'

import Trifid from './index.js'
import ConfigHandler from './lib/ConfigHandler.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const program = new Command()

program.option('-c, --config <path>', 'configuration file', 'config.json')
  .option('-p, --port <port>', 'listener port', parseInt)
  .parse(process.argv)

const opts = program.opts()

// create a minimal configuration with a baseConfig pointing to the given config file
const config = {
  baseConfig: join(process.cwd(), opts.config)
}

// add optional arguments to the configuration
if (opts.port) {
  config.listener = {
    port: opts.port
  }
}

// load the configuration and start the server
const trifid = new Trifid()
trifid.configHandler.resolver.use('trifid', ConfigHandler.pathResolver(__dirname))
trifid.init(config).then(() => {
  return trifid.app()
}).catch((err) => {
  console.error(err)
  process.exit(1)
})
