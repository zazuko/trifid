const Promise = require('bluebird')
const sortBy = require('lodash/sortBy')
const debug = require('debug')('trifid')
const moduleLoader = require('./module-loader')

function prepare (list) {
  // key values -> array with name property
  const array = Object.keys(list).reduce((array, key) => {
    const plugin = list[key]

    plugin.name = key

    array.push(plugin)

    return array
  }, [])

  return sortBy(array, 'priority')
}

function load (list, router, config, context) {
  list = prepare(list)

  return Promise.mapSeries(list, (plugin) => {
    debug('loading: %s', plugin.name)

    const params = config[plugin.name]
    const func = moduleLoader.require(plugin.module)

    return func.call(context, router, params, plugin)
  })
}

module.exports = {
  prepare: prepare,
  load: load
}
