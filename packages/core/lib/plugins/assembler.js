import defaultPlugins from './default.js'
import load from './loader.js'
import sort from './sort.js'
import standardize from './standardize.js'

const assembler = async (config, additionalPlugins = {}) => {
  const loadedPlugins = await load(config)

  const plugins = {
    ...defaultPlugins,
    ...additionalPlugins,
    ...loadedPlugins,
  }

  return sort(
    Object.entries(plugins).map((m) => {
      return [m[0], standardize(m[1])]
    }),
  )
}

export default assembler
