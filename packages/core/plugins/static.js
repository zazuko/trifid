// @ts-check

import fastifyStatic from '@fastify/static'

/** @type {import('../types/index.js').TrifidPlugin} */
const factory = async (trifid) => {
  const { config, paths } = trifid
  const { directory } = config
  if (!directory) {
    throw new Error("configuration is missing 'directory' field")
  }

  const staticConfiguration = {
    root: directory,
    decorateReply: false,
  }
  if (!paths || (Array.isArray(paths) && paths.length === 0)) {
    // Register static file serving for the root path
    trifid.server.register(fastifyStatic, {
      ...staticConfiguration,
      prefix: '/',
    })
  } else {
    // Register static file serving for each configured path
    paths.forEach((path) => {
      trifid.server.register(fastifyStatic, {
        ...staticConfiguration,
        prefix: path,
      })
    })
  }

  return {
    defaultConfiguration: async () => {
      return {
        methods: ['GET'],
        // Serve static files after other routes
        order: 1200,
      }
    },
  }
}

export default factory
