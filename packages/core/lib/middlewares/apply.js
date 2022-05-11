const apply = async (server, middlewares) => {
  for (const middleware of middlewares) {
    const name = middleware[0]
    const config = middleware[1]

    const { paths, hosts, methods, module } = config

    delete config.paths
    delete config.hosts
    delete config.methods
    delete config.order
    delete config.module

    console.log(name, paths, hosts, methods, module)
  }
}

export default apply
