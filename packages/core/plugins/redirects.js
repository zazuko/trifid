function redirect (router, options) {
  return this.middleware.mountAll(router, options, (config) => {
    return (req, res, next) => {
      if (req.originalUrl !== config.path) {
        return next()
      }

      res.redirect(config.target)
    }
  })
}

module.exports = redirect
