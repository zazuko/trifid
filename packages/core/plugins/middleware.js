function middleware (router, options, plugin) {
  options = options || {root: {}}

  return this.middleware.mountAll(router, options, (config) => {
    const factory = this.moduleLoader.require(plugin.middleware)

    if (plugin.params) {
      return factory.apply(null, plugin.params)
    } else {
      return factory(config)
    }
  })
}

module.exports = middleware
