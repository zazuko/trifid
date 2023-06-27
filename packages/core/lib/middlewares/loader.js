import path from 'path'
import cloneDeep from 'lodash/cloneDeep.js'

const resolvePath = (modulePath) => {
  if (['.', '/'].includes(modulePath.slice(0, 1))) {
    return path.resolve(modulePath)
  } else {
    return modulePath
  }
}

export const loader = async (modulePath) => {
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
  }))

  return middlewares
}

export default load
