// @ts-check

/**
 * Wait for a variable to be truthy, with a timeout.
 *
 * @param {Function} getValueFunction A function that needs to return a truthy value to resolve the promise
 * @param {number} [timeoutMs] The maximum time to wait for the variable to be truthy, in milliseconds
 * @param {number} [checkIntervalMs] The interval at which to check the variable's value, in milliseconds
 * @param {string} [errorMessage] The error message to use if the promise is rejected
 * @returns {Promise<void>}
 */
export const waitForVariableToBeTrue = async (getValueFunction, timeoutMs = 30000, checkIntervalMs = 20, errorMessage = 'Reached Timeout') => {
  return new Promise((resolve, reject) => {
    let timeoutId = null

    // Check the variable's value periodically
    const interval = setInterval(() => {
      if (getValueFunction()) {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        clearInterval(interval)
        resolve()
      }
    }, checkIntervalMs)

    // Set a timeout to reject the promise if the time exceeds the specified duration
    timeoutId = setTimeout(() => {
      clearInterval(interval)
      reject(new Error(errorMessage))
    }, timeoutMs)
  })
}
