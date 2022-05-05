import sortBy from 'lodash/sortBy.js'
import debugLib from 'debug'
import customImport from './module-loader.js'

const debug = debugLib('trifid:core')

const prepare = (list) => {
  // key values -> array with name property
  const array = Object.keys(list).reduce((array, key) => {
    const plugin = list[key]

    plugin.name = key

    array.push(plugin)

    return array
  }, [])

  return sortBy(array, 'priority')
}

async function load (list, router, config, context) {
  const result = []
  for (const plugin of prepare(list)) {
    debug('loading: %s', plugin.name)

    const params = config[plugin.name]
    const func = await customImport(plugin.module)

    result.push(func.call(context, router, params, plugin))
  }

  return result
}

export default {
  prepare,
  load
}
