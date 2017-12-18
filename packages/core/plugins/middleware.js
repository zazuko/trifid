function middleware (router, config, plugin) {
  const factory = this.moduleLoader.require(plugin.middleware)

  let middleware

  if (plugin.params) {
    middleware = factory.apply(null, plugin.params)
  } else {
    middleware = factory(config)
  }

  router.use(middleware)
}

module.exports = middleware
