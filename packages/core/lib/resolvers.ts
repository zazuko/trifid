import { resolve, join } from 'node:path'

/**
 * Register a resolver.
 *
 * @param name Name of the resolver.
 * @param callback Callback to call when the resolver matches.
 * @param value Value to resolve.
 */
export const registerResolver = (
  name: string,
  callback: (name: string) => string,
  value: string,
): string => {
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

export const pathResolver = (base: string, path: string): string => {
  const resolvedPath = resolve(path)
  if (resolvedPath === path) {
    return path
  }

  return join(base, path)
}

/**
 * Environment resolver
 */

export const envCallback = (name: string): string => {
  if (process.env[name] === undefined) {
    // eslint-disable-next-line no-console
    console.warn(`WARNING: '${name}' environment variable is not set`)
    return ''
  }
  return process.env[name]
}

export const envResolver = (value: string): string => {
  return registerResolver('env', envCallback, value)
}

/**
 * Current working directory resolver.
 */

export const cwdCallback = (name: string): string => {
  return pathResolver(process.cwd(), name)
}

export const cwdResolver = (value: string): string => {
  return registerResolver('cwd', cwdCallback, value)
}

/**
 * File resolver.
 *
 * @param base Base path to resolve from.
 */
export const fileCallback = (base?: string) => {
  return (name: string): string => {
    if (base === undefined) {
      base = process.cwd()
    }
    return pathResolver(base, name)
  }
}

/**
 * Register the file resolver.
 *
 * @param value Value to resolve.
 * @param base Base path to resolve from.
 */
export const fileResolver = (value: string, base?: string): string => {
  return registerResolver('file', fileCallback(base), value)
}
