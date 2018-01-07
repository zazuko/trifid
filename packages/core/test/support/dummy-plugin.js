function dummyPlugin (router) {
  return router.callback(arguments, this)
}

module.exports = dummyPlugin
