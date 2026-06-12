/**
 * Check the dataset base URL.
 * Some hints are provided if the dataset base URL is not correctly formatted.
 * If a value is empty, an error is thrown.
 *
 * @param logger - The logger instance
 * @param datasetBaseUrl - The dataset base URL
 * @returns The dataset base URL as an array
 */
export const checkSingleDatasetBaseUrl = (
  logger: { warn: (message: string) => void },
  datasetBaseUrl: unknown,
): true => {
  if (typeof datasetBaseUrl !== 'string') {
    throw new Error('The datasetBaseUrl must be a string');
  }

  if (!datasetBaseUrl) {
    throw new Error('Value for \'datasetBaseUrl\' is missing');
  }

  if (!datasetBaseUrl.endsWith('/')) {
    logger.warn(`The value for 'datasetBaseUrl' should usually end with a '/' ; it is not the case for '${datasetBaseUrl}'`);
  }

  return true;
};

/**
 * Check the dataset base URL, and make sure it returns an array.
 * Some hints are provided if the dataset base URL is not correctly formatted.
 * If the dataset base URL is an array, each value is checked.
 * If there is no dataset base URL, an empty array is returned.
 *
 * @param logger - The logger instance
 * @param datasetBaseUrl - The dataset base URL
 * @returns The dataset base URL as an array
 */
export const checkDatasetBaseUrl = (
  logger: { warn: (message: string) => void },
  datasetBaseUrl: unknown,
): string[] => {
  if (!datasetBaseUrl) {
    return [];
  }

  if (Array.isArray(datasetBaseUrl)) {
    datasetBaseUrl.forEach((value) => checkSingleDatasetBaseUrl(logger, value));
    return datasetBaseUrl;
  } else {
    checkSingleDatasetBaseUrl(logger, datasetBaseUrl);
    return [datasetBaseUrl as string];
  }
};
