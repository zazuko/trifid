function redirect (router, options) {
  return this.middleware.mountAll(router, options, config => {
    return (req, res) => {
      res.redirect(config.target)
    }
  })
}

export default redirect
