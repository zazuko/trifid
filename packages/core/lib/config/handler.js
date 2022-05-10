import shush from 'shush'
import merge from 'lodash/merge.js'
import parser from './parser.js'
import { cwdCallback } from '../resolvers.js'
import { extendsResolver, globalsResolver, middlewaresResolver, serverResolver } from './resolvers.js'
import { defaultPort, maxDepth } from './default.js'

const resolveConfigFile = async (filePath, depth = 0) => {
  if (depth >= maxDepth) {
    throw new Error('reached max configuration depth, maybe you went in an infinite loop. Please check the extends values from your configuration file recursively')
  }

  // read config file
  const fileFullPath = cwdCallback(filePath)
  const fileContent = shush(fileFullPath)
  const config = parser(fileContent)
  addDefaultFields(config)

  // fetch all configuration files from which this one is extending
  let configs = []
  if (Array.isArray(config.extends) && config.extends.length > 0) {
    config.extends = extendsResolver(config.extends, fileFullPath)
    configs = await Promise.all(config.extends.map(configPath => resolveConfigFile(configPath, depth + 1)))
  }

  // merge all fields
  const middlewares = {}
  configs.forEach(c => {
    // merge globals and server parts
    config.globals = merge(c.globals, config.globals)
    config.server = merge(c.server, config.server)

    // merge middlewares
    Object.keys(c.middlewares).forEach(m => {
      middlewares[m] = c.middlewares[m]
    })
  })
  Object.keys(config.middlewares).forEach(m => {
    middlewares[m] = config.middlewares[m]
  })

  // apply all resolvers
  config.middlewares = middlewaresResolver(middlewares, fileFullPath)
  config.globals = globalsResolver(config.globals, fileFullPath)
  config.server = serverResolver(config.server, fileFullPath)

  // we don't need the extends field anymore
  delete config.extends

  return config
}

/**
 * Add default fields for a configuration.
 *
 * @param {*} config
 */
const addDefaultFields = (config) => {
  if (!config.server) {
    config.server = {}
  }

  if (!config.globals) {
    config.globals = {}
  }

  if (!config.middlewares) {
    config.middlewares = {}
  }
}

/**
 * Add the default port for the server configuration.
 *
 * @param {*} config
 */
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

export default handler
