// @ts-check

/**
 * Return the value for the specific key.
 * If the value is not present, return the default value.
 *
 * @param {string} key Key to search for
 * @param {Record<string, any>} values Values to search in
 * @param {any} defaultValue Default value to return
 * @returns {any} Value for the specific key or the default value
 */
export const defaultValue = (key, values, defaultValue) => {
  if (values[key] === undefined) {
    return defaultValue
  }
  return values[key]
}
