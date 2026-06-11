import type { TrifidConfig } from '../../types/index.ts'
import defaultPlugins from './default.ts'
import load from './loader.ts'
import sort from './sort.ts'
import standardize from './standardize.ts'
import type { LoadedPlugin, StandardizedPlugin } from './standardize.ts'

const assembler = async (
  config: TrifidConfig,
  additionalPlugins: Record<string, LoadedPlugin> = {},
): Promise<Array<[string, StandardizedPlugin]>> => {
  const loadedPlugins = await load(config)

  const plugins: Record<string, LoadedPlugin> = {
    ...defaultPlugins,
    ...additionalPlugins,
    ...loadedPlugins,
  }

  return sort(
    Object.entries(plugins).map(([name, plugin]): [string, StandardizedPlugin] => {
      return [name, standardize(plugin)]
    }),
  )
}

export default assembler
