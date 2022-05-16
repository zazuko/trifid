const factory = (trifid) => {
  const { target } = trifid.config
  if (!target) {
    throw new Error("configuration is missing 'target' field")
  }

  return (_req, res, _next) => {
    res.redirect(target)
  }
}

export default factory
