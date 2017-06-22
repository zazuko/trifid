var mount = require('./mount-middleware')

function factory (router, options) {
  mount(router, options, function (config) {
    return function (req, res, next) {
      if (req.originalUrl !== config.path) {
        return next()
      }

      res.redirect(config.target)
    }
  })
}

module.exports = factory
