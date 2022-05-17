const factory = (trifid) => {
  const { logger } = trifid

  return (req, res, _next) => {
    logger.debug(`path '${req.url}' returned a 404 error (Not Found)`)
    res.status(404).send('Page not found')
  }
}

export default factory
