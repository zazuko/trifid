import { resolve } from 'node:path'
import cloneDeep from 'lodash/cloneDeep.js'

const resolvePath = (modulePath) => {
  if (['.', '/'].includes(modulePath.slice(0, 1))) {
    return resolve(modulePath)
  } else {
    return modulePath
  }
}

export const loader = async (modulePath) => {
  const plugin = await import(resolvePath(modulePath))
  return plugin.default
}

const load = async (config) => {
  let plugins = {}
  if (config.plugins && typeof config.plugins === 'object') {
    plugins = cloneDeep(config.plugins)
  }

  await Promise.all(
    Object.keys(plugins).map(async (m) => {
      if (plugins[m] === null) {
        delete plugins[m]
        return
      }

      if (!plugins[m].module) {
        throw new Error(`plugin '${m}' has no module configured`)
      }

      plugins[m].module = await loader(plugins[m].module)
    }),
  )

  return plugins
}

export default load
