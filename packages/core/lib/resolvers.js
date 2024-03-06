import { resolve, join } from 'node:path'

/**
 * Register a resolver.
 *
 * @param {string} name
 * @param {(name: string): string} callback
 */
export const registerResolver = (name, callback, value) => {
  const split = value.split(':')
  if (split.length === 1) {
    return value
  }

  if (split[0] !== name) {
    return value
  }

  split.shift()
  return callback(split.join(':'))
}

export const pathResolver = (base, path) => {
  const resolvedPath = resolve(path)
  if (resolvedPath === path) {
    return path
  }

  return join(base, path)
}

/**
 * Environment resolver
 */

export const envCallback = (name) => {
  if (!process.env[name]) {
    // eslint-disable-next-line no-console
    console.warn(`WARNING: '${name}' environment variable is not set`)
    return ''
  }
  return process.env[name]
}

export const envResolver = (value) => {
  return registerResolver('env', envCallback, value)
}

/**
 * Current working directory resolver.
 */

export const cwdCallback = (name) => {
  return pathResolver(process.cwd(), name)
}

export const cwdResolver = (value) => {
  return registerResolver('cwd', cwdCallback, value)
}

/**
 * File resolver.
 * @param {any | undefined} [base]
 */
export const fileCallback = (base) => {
  return (name) => {
    if (base === undefined) {
      base = process.cwd()
    }
    return pathResolver(base, name)
  }
}

/**
 * Register the file resolver.
 *
 * @param {any | undefined} value
 * @param {any | undefined} [base]
 */
export const fileResolver = (value, base) => {
  return registerResolver('file', fileCallback(base), value)
}
