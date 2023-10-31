// @ts-check

/** @type {import('../types/index.d.ts').TrifidMiddleware} */
const factory = (trifid) => {
  const { logger } = trifid

  return (err, _req, res, _next) => {
    logger.error(err.stack)

    res.statusCode = res.statusCode || 500
    if (res.statusCode < 400) {
      res.statusCode = 500
    }

    res.end()
  }
}

export default factory
