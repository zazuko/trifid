import merge from 'lodash/merge.js'
import vhost from 'vhost'

const trifidObject = (config, server) => {
  return {
    config,
    server
  }
}

const apply = async (server, globals, middlewares) => {
  for (const middleware of middlewares) {
    const name = middleware[0]
    const m = middleware[1]

    const { paths, hosts, methods, module, config } = m

    delete m.paths
    delete m.hosts
    delete m.methods
    delete m.order
    delete m.module

    const trifid = trifidObject(merge(globals, config), server)
    const loadedMiddleware = await module(trifid)

    if (paths.length === 0) {
      if (methods.length === 0) {
        if (hosts.length === 0) {
          server.use(loadedMiddleware)
        } else {
          hosts.map(host => server.use(vhost(host, loadedMiddleware)))
        }
      } else {
        if (hosts.length === 0) {
          methods.map(method => server[method](loadedMiddleware))
        } else {
          hosts.map(host => methods.map(method => server[method](vhost(host, loadedMiddleware))))
        }
      }
    } else {
      for (const path of paths) {
        if (methods.length === 0) {
          if (hosts.length === 0) {
            server.use(path, loadedMiddleware)
          } else {
            hosts.map(host => server.use(path, vhost(host, loadedMiddleware)))
          }
        } else {
          if (hosts.length === 0) {
            methods.map(method => server[method](path, loadedMiddleware))
          } else {
            hosts.map(host => methods.map(method => server[method](path, vhost(host, loadedMiddleware))))
          }
        }
      }
    }

    console.log(name, paths, hosts, methods, module)
  }
}

export default apply
