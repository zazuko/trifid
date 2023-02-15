import morgan from 'morgan'

/**
 * Log requests.
 *
 * Configuration fields:
 *  - format (string): format for the morgan logger (default value: "combined")
 *                     see: https://github.com/expressjs/morgan#predefined-formats
 *
 * @param {*} trifid Trifid object containing the configuration, and other utility functions.
 * @returns Express middleware.
 */
const factory = (trifid) => {
  const { config } = trifid
  const format = config.format ?? 'combined'
  return morgan(format)
}

export default factory
