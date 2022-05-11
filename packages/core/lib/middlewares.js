import path from 'path'
import cloneDeep from 'lodash/cloneDeep.js'

const resolvePath = (modulePath) => {
  if (['.', '/'].includes(modulePath.slice(0, 1))) {
    return path.resolve(modulePath)
  } else {
    return modulePath
  }
}

const loader = async (modulePath) => {
  const middleware = await import(resolvePath(modulePath))
  return middleware.default
}

const load = async (config) => {
  let middlewares = {}
  if (config.middlewares && typeof config.middlewares === 'object') {
    middlewares = cloneDeep(config.middlewares)
  }

  await Promise.all(Object.keys(middlewares).map(async (m) => {
    if (middlewares[m] === null) {
      delete middlewares[m]
      return
    }

    if (!middlewares[m].module) {
      throw new Error(`middleware '${m}' has no module configured`)
    }

    middlewares[m].module = await loader(middlewares[m].module)

    // make sure order is defined
    if (middlewares[m].order === undefined) {
      middlewares[m].order = 0
    }

    // make sure paths is defined and is an array
    if (middlewares[m].paths === undefined) {
      middlewares[m].paths = []
    }
    if (typeof middlewares[m].paths === 'string') {
      middlewares[m].paths = [middlewares[m].paths]
    }

    // make sure methods is defined and is an array
    if (middlewares[m].methods === undefined) {
      middlewares[m].methods = []
    }
    if (typeof middlewares[m].methods === 'string') {
      middlewares[m].methods = [middlewares[m].methods]
    }

    // make sure hosts is defined and is an array
    if (middlewares[m].hosts === undefined) {
      middlewares[m].hosts = []
    }
    if (typeof middlewares[m].hosts === 'string') {
      middlewares[m].hosts = [middlewares[m].hosts]
    }
  }))

  return middlewares
}

export default load
