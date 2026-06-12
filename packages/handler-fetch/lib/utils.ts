/**
 * Wait for a variable to be truthy, with a timeout.
 *
 * @param getValueFunction A function that needs to return a truthy value to resolve the promise
 * @param timeoutMs The maximum time to wait for the variable to be truthy, in milliseconds
 * @param checkIntervalMs The interval at which to check the variable's value, in milliseconds
 * @param errorMessage The error message to use if the promise is rejected
 */
export const waitForVariableToBeTrue = async (
  getValueFunction: () => unknown,
  timeoutMs = 30000,
  checkIntervalMs = 20,
  errorMessage = 'Reached Timeout',
): Promise<void> => {
  return new Promise((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // Check the variable's value periodically
    const interval = setInterval(() => {
      if (getValueFunction()) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        clearInterval(interval);
        resolve();
      }
    }, checkIntervalMs);

    // Set a timeout to reject the promise if the time exceeds the specified duration
    timeoutId = setTimeout(() => {
      clearInterval(interval);
      reject(new Error(errorMessage));
    }, timeoutMs);
  });
};
