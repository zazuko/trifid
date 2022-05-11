import { dirname } from 'path'

import { cwdResolver, envResolver, fileCallback, fileResolver } from '../resolvers.js'

/**
 *
 * @param {string[]} value Array of paths.
 * @param {string} context Configuration file full path.
 * @returns
 */
export const extendsResolver = (value, context) => {
  const dir = dirname(context)
  return value.map(path => {
    return fileCallback(dir)(fileResolver(cwdResolver(path), dir))
  })
}

export const applyResolvers = (value, context) => {
  if (typeof value === 'object') {
    Object.keys(value).map(k => {
      value[k] = serverResolver(value[k], context)
      return value[k]
    })

    return value
  }

  if (typeof value === 'string') {
    return fileResolver(cwdResolver(envResolver(value)), context)
  }

  return value
}

export const serverResolver = (value, context) => {
  return applyResolvers(value, context)
}

export const globalsResolver = (value, context) => {
  return applyResolvers(value, context)
}

export const middlewaresResolver = (value, context) => {
  return applyResolvers(value, context)
}
