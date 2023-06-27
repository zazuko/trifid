const factory = (trifid) => {
  const { logger } = trifid

  return (_req, res, _next) => {
    logger.debug('reached health endpoint')

    res.set('Content-Type', 'text/plain')
    res.send('ok')
  }
}

export default factory
