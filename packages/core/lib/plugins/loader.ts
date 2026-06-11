import { resolve } from 'node:path'
import cloneDeep from 'lodash/cloneDeep.js'

import type { TrifidConfig, TrifidPlugin } from '../../types/index.ts'
import type { LoadedPlugin } from './standardize.ts'

const resolvePath = (modulePath: string) => {
  if (['.', '/'].includes(modulePath.slice(0, 1))) {
    return resolve(modulePath)
  } else {
    return modulePath
  }
}

export const loader = async (modulePath: string): Promise<TrifidPlugin> => {
  const plugin = await import(resolvePath(modulePath))
  return plugin.default as TrifidPlugin
}

const load = async (config: TrifidConfig): Promise<Record<string, LoadedPlugin>> => {
  const source = (config.plugins && typeof config.plugins === 'object')
    ? cloneDeep(config.plugins)
    : {}

  const plugins: Record<string, LoadedPlugin> = {}

  await Promise.all(
    Object.entries(source).map(async ([name, pluginConfig]) => {
      if (pluginConfig === null || pluginConfig === undefined) {
        return
      }

      if (!pluginConfig.module) {
        throw new Error(`plugin '${name}' has no module configured`)
      }

      const { module, ...rest } = pluginConfig
      plugins[name] = { ...rest, module: await loader(module) }
    }),
  )

  return plugins
}

export default load
