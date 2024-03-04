import merge from 'lodash/merge.js'
import { initQuery } from '../sparql.js'

/**
 *
 * @param {import('fastify').FastifyInstance} server
 * @param {*} globals
 * @param {*} middlewares
 * @param {import('pino').Logger} logger
 * @param {*} templateEngine
 * @param {string} instanceHostname
 * @param {import('node:events').EventEmitter} trifidEvents
 */
const apply = async (server, globals, middlewares, logger, templateEngine, instanceHostname, trifidEvents) => {
  const { query: querySparql } = initQuery(logger, globals.endpoints, instanceHostname)

  for (const middleware of middlewares) {
    const name = middleware[0]
    const m = middleware[1]

    const { paths, hosts, methods, module, config } = m

    delete m.paths
    delete m.hosts
    delete m.methods
    delete m.order
    delete m.module

    const middlewareLogger = logger.child({ name })
    const query = querySparql(logger.child({ name: `${name}:query` }))

    let pluginConfig = {
      paths,
      hosts,
      methods,
      config: merge({}, globals, config),
    }

    const { render, registerHelper } = templateEngine
    const loadedMiddleware = await module({
      ...pluginConfig,
      server,
      logger: middlewareLogger,
      render,
      query,
      registerTemplateHelper: registerHelper,
      trifidEvents,
    })

    let routeHandler
    if (loadedMiddleware) {
      if (loadedMiddleware.defaultConfiguration) {
        const defaultConfiguration = await loadedMiddleware.defaultConfiguration()
        if (defaultConfiguration) {
          pluginConfig = merge({}, defaultConfiguration, pluginConfig)
        }
      }

      if (loadedMiddleware.routeHandler) {
        routeHandler = await loadedMiddleware.routeHandler()
      }
    }

    if (!routeHandler) {
      // @TODO: remove this when all middlewares are up-to-date
      logger.warn(`mount '${name}' middleware ; no handler found ; skipped`)
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
          `mount '${name}' middleware (methods=${baseRouteOptions.method}, path=${path})`,
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
            `mount '${name}' middleware (methods=${baseRouteOptions.methods}, path=${path}, host=${host})`,
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
