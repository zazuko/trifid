import shush from 'shush'
import parser from './parser.js'
import { cwdCallback } from '../resolvers.js'

// configuration
const maxDepth = 50
const defaultPort = 8080

const resolveConfigFile = async (filePath, depth = 0) => {
  if (depth >= maxDepth) {
    throw new Error('reached max configuration depth, maybe you went in an infinite loop. Please check the extends values from your configuration file recursively')
  }

  // read config file
  const fileFullPath = cwdCallback(filePath)
  const fileContent = shush(fileFullPath)
  const config = parser(fileContent)

  if (config.extends && Array.isArray(config.extends) && config.extends.length > 0) {
    // TODO: add support for "extends"

    console.warn('[WARNING] extends fields are not supported currently')

    // const configs = await Promise.all(config.extends.map(configPath => resolveConfigFile(configPath, depth + 1)))

    // TODO: merge configs
  }

  return config
}

const addDefaultFields = (config) => {
  if (!config.server) {
    config.server = {}
  }

  if (!config.extends) {
    config.extends = []
  }

  if (!config.globals) {
    config.globals = {}
  }

  if (!config.middlewares) {
    config.middlewares = {}
  }
}

const addDefaultPort = (config) => {
  if (!config.server.listener) {
    config.server.listener = {}
  }
  if (config.server.listener.port === undefined) {
    config.server.listener.port = defaultPort
  }
}

const handler = async (configFile) => {
  const config = configFile ? await resolveConfigFile(configFile) : {}
  addDefaultFields(config)
  addDefaultPort(config)

  return config
}

console.log(await handler('config.json'))

export default handler
