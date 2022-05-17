import merge from 'lodash/merge.js'
import vhost from 'vhost'

const trifidObject = (config, server, logger, render) => {
  return {
    config,
    server,
    logger,
    render
  }
}

const apply = async (server, globals, middlewares, logger, templateEngine) => {
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
    const trifid = trifidObject(merge({}, globals, config), server, middlewareLogger, templateEngine)
    const loadedMiddleware = await module(trifid)

    // default path is '/' (see: https://github.com/expressjs/express/blob/d854c43ea177d1faeea56189249fff8c24a764bd/lib/router/index.js#L425)
    if (paths.length === 0) {
      paths.push('/')
    }

    // if no methods are specified, use 'use'
    if (methods.length === 0) {
      methods.push('use')
    }

    // mount the middleware the way it should
    for (const path of paths) {
      if (hosts.length === 0) {
        // keeping this to be called without 'vhost' is needed for the error handler to work
        methods.map((method) => {
          logger.debug(`mount '${name}' middleware (method=${method}, path=${path})`)
          return server[method](path, loadedMiddleware)
        })
      } else {
        hosts.map((host) => {
          return methods.map((method) => {
            logger.debug(`mount '${name}' middleware (method=${method}, path=${path}, host=${host})`)
            return server[method](path, vhost(host, loadedMiddleware))
          })
        })
      }
    }
  }
}

export default apply
