const factory = (trifid) => {
  const { logger } = trifid

  return (err, _req, res, _next) => {
    logger.error(err.stack || err.message)

    res.statusCode = err.statusCode || 500
    res.end()
  }
}

export default factory
