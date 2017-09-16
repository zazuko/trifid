var mount = require('./mount-middleware')

function redirect (router, options) {
  return mount.all(router, options, function (config) {
    return function (req, res, next) {
      if (req.originalUrl !== config.path) {
        return next()
      }

      res.redirect(config.target)
    }
  })
}

module.exports = redirect
