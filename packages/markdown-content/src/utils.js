// @ts-check

/**
 * Return the value for the specific key.
 * If the value is not present, return the default value.
 *
 * @template T
 * @param {string} key Key to search for
 * @param {Record<string, T>} values Values to search in
 * @param {T} defaultValue Default value to return
 * @returns {T} Value for the specific key or the default value
 */
export const defaultValue = (key, values, defaultValue) => {
  if (values[key] === undefined) {
    return defaultValue
  }
  return values[key]
}
