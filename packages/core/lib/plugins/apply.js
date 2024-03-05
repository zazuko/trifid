import merge from 'lodash/merge.js'
import { initQuery } from '../sparql.js'

/**
 *
 * @param {import('fastify').FastifyInstance} server
 * @param {*} globals
 * @param {*} plugins
 * @param {import('pino').Logger} logger
 * @param {*} templateEngine
 * @param {string} instanceHostname
 * @param {import('node:events').EventEmitter} trifidEvents
 */
const apply = async (server, globals, plugins, logger, templateEngine, instanceHostname, trifidEvents) => {
  const { query: querySparql } = initQuery(logger, globals.endpoints, instanceHostname)

  for (const plugin of plugins) {
    const name = plugin[0]
    const m = plugin[1]

    const { paths, hosts, methods, module, config } = m

    delete m.paths
    delete m.hosts
    delete m.methods
    delete m.order
    delete m.module

    const pluginLogger = logger.child({ name })
    const query = querySparql(logger.child({ name: `${name}:query` }))

    const pluginConfig = {
      paths,
      hosts,
      methods,
      config: merge({}, globals, config),
    }

    const { render, registerHelper } = templateEngine
    const loadedPlugin = await module({
      ...pluginConfig,
      server,
      logger: pluginLogger,
      render,
      query,
      registerTemplateHelper: registerHelper,
      trifidEvents,
    })

    let routeHandler
    if (loadedPlugin) {
      if (loadedPlugin.defaultConfiguration) {
        const defaultConfiguration = await loadedPlugin.defaultConfiguration()
        if (defaultConfiguration) {
          if (defaultConfiguration.paths && pluginConfig.paths.length === 0) {
            pluginConfig.paths = defaultConfiguration.paths
          }
          if (defaultConfiguration.hosts && pluginConfig.hosts.length === 0) {
            pluginConfig.hosts = defaultConfiguration.hosts
          }
          if (defaultConfiguration.methods && pluginConfig.methods.length === 0) {
            pluginConfig.methods = defaultConfiguration.methods
          }
        }
      }

      if (loadedPlugin.routeHandler) {
        routeHandler = await loadedPlugin.routeHandler()
      }
    }

    if (!routeHandler) {
      continue
    }

    const { hosts: pluginHosts, methods: pluginMethods, paths: pluginPaths } = pluginConfig

    const baseRouteOptions = {
      method: pluginMethods,
      handler: routeHandler,
    }

    if (pluginHosts.length === 0) {
      for (const path of pluginPaths) {
        logger.debug(
          `mount '${name}' plugin (methods=${baseRouteOptions.method}, path=${path})`,
        )
        server.route({
          ...baseRouteOptions,
          url: path,
        })
      }
    } else {
      for (const host of pluginHosts) {
        for (const path of pluginPaths) {
          logger.debug(
            `mount '${name}' plugin (methods=${baseRouteOptions.methods}, path=${path}, host=${host})`,
          )
          server.route({
            ...baseRouteOptions,
            url: path,
            constraints: {
              host,
            },
          })
        }
      }
    }
  }
}

export default apply
