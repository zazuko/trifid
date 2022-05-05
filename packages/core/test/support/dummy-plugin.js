function dummyPlugin (router) {
  return router.callback(arguments, this)
}

export default dummyPlugin
