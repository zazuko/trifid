async function middleware (router, options, plugin) {
  options = options || { root: {} }

  return await this.middleware.mountAll(router, options, async config => {
    const factory = await this.moduleLoader(plugin.middleware)

    if (plugin.params) {
      return factory.apply(null, plugin.params)
    } else {
      return factory(config)
    }
  })
}

export default middleware
