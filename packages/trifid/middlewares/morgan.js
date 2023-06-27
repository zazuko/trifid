import morgan from "morgan";

/**
 * Log requests.
 *
 * Configuration fields:
 *  - format (string): format for the morgan logger (default: "combined")
 *                     see: https://github.com/expressjs/morgan#predefined-formats
 *  - disabled (boolean|string): disable morgan logger (default: false)
 *
 * @param {*} trifid Trifid object containing the configuration, and other utility functions.
 * @returns Express middleware.
 */
const factory = (trifid) => {
  const { config } = trifid;
  const format = config.format ?? "combined";
  const disabled = `${config.disabled}` === "true";

  if (disabled) {
    return (_req, _res, next) => {
      next();
    };
  }

  return morgan(format);
};

export default factory;
