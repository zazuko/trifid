/**
 * Generate the value for the Authorization header for basic authentication.
 *
 * @param {string} user The username.
 * @param {string} password The password of that user.
 * @returns {string} The value of the Authorization header to use.
 */
export const authBasicHeader = (user, password) => {
  const base64String = Buffer.from(`${user}:${password}`).toString('base64')
  return `Basic ${base64String}`
}

/**
 * Assert that the value is an object.
 * Return the value if it is an object, otherwise return false.
 *
 * @param {any} value The value to assert.
 * @returns {Object | false} The value, if it is an object, otherwise false.
 */
export const assertObject = (value) => {
  if (value === null || typeof value !== 'object') {
    return false
  }
  return value
}

/**
 * Return the length of an object.
 * @param {any} obj The object to get the length of.
 * @returns {number} The length of the object.
 */
export const objectLength = (obj) => {
  if (!assertObject(obj)) {
    return 0
  }
  return Object.keys(obj).length
}

/**
 * Check if a string is a valid URL.
 *
 * @param {string} url The URL to check.
 * @returns {boolean} True if the URL is valid, false otherwise.
 */
export const isValidUrl = (url) => {
  try {
    // eslint-disable-next-line no-new
    new URL(url)
    return true
  } catch {
    return false
  }
}
