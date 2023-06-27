const factory = (trifid) => {
  const { config, logger } = trifid
  const { target } = config
  if (!target) {
    throw new Error("configuration is missing 'target' field")
  }

  return (_req, res, _next) => {
    logger.debug(`redirect to: ${target}`)
    res.redirect(target)
  }
}

export default factory
