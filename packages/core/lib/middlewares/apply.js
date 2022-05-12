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

    // default path is '/' (see: https://github.com/expressjs/express/blob/d854c43ea177d1faeea56189249fff8c24a764bd/lib/router/index.js#L425)
    if (paths.length === 0) {
      paths.push('/')
    }

    // if no methods are specified, use 'use'
    if (methods.length === 0) {
      methods.push('use')
    }

    for (const path of paths) {
      if (hosts.length === 0) {
        methods.map(method => server[method](path, loadedMiddleware))
      } else {
        hosts.map(host => methods.map(method => server[method](path, vhost(host, loadedMiddleware))))
      }
    }

    console.log(name, paths, hosts, methods, module)
  }
}

export default apply
