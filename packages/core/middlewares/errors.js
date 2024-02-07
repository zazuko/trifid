// @ts-check

/** @type {import('../types/index.js').TrifidMiddleware} */
const factory = (trifid) => {
  const { logger } = trifid

  return (err, _req, res, _next) => {
    logger.error(err.stack)

    res.statusCode = res.statusCode || 500
    // handle the case where there is an error, but no specific status code has been set
    if (res.statusCode < 400) {
      res.statusCode = 500
    }

    res.end()
  }
}

export default factory
