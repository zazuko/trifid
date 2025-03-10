// @ts-check

/**
 * Check the dataset base URL.
 * Some hints are provided if the dataset base URL is not correctly formatted.
 * If a value is empty, an error is thrown.
 *
 * @param {{warn: Function }} logger - The logger instance
 * @param {string} datasetBaseUrl - The dataset base URL
 * @returns {true} The dataset base URL as an array
 */
export const checkSingleDatasetBaseUrl = (logger, datasetBaseUrl) => {
  if (typeof datasetBaseUrl !== 'string') {
    throw new Error('The datasetBaseUrl must be a string')
  }

  if (!datasetBaseUrl) {
    throw new Error("Value for 'datasetBaseUrl' is missing")
  }

  if (!datasetBaseUrl.endsWith('/')) {
    logger.warn(`The value for 'datasetBaseUrl' should usually end with a '/' ; it is not the case for '${datasetBaseUrl}'`)
  }

  return true
}

/**
 * Check the dataset base URL, and make sure it returns an array.
 * Some hints are provided if the dataset base URL is not correctly formatted.
 * If the dataset base URL is an array, each value is checked.
 * If there is no dataset base URL, an empty array is returned.
 *
 * @param {{warn: Function }} logger - The logger instance
 * @param {string | string[]} datasetBaseUrl - The dataset base URL
 * @returns {string[]} The dataset base URL as an array
 */
export const checkDatasetBaseUrl = (logger, datasetBaseUrl) => {
  if (!datasetBaseUrl) {
    return []
  }

  if (Array.isArray(datasetBaseUrl)) {
    datasetBaseUrl.forEach((value) => checkSingleDatasetBaseUrl(logger, value))
    return datasetBaseUrl
  } else {
    checkSingleDatasetBaseUrl(logger, datasetBaseUrl)
    return [datasetBaseUrl]
  }
}
