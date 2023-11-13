// @ts-check

/** @type {import('../types/index.d.ts').TrifidMiddleware} */
const factory = (trifid) => {
  const { logger } = trifid

  return (err, _req, res, _next) => {
    logger.error(err.stack)

    let status = res.statusCode || 500
    // handle the case where there is an error, but no specific status code has been set
    if (status < 400) {
      status = 500
    }

    res.sendStatus(status)
  }
}

export default factory
