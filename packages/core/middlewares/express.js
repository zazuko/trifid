import { loader } from '../lib/middlewares/loader.js'

/**
 * Import a plain Express middleware.
 *
 * Configuration fields:
 *  - module (string, required): the name of the NPM module to load
 *  - options (any, optional): some options to pass to the Express middleware
 *
 * @param {*} trifid Trifid object containing the configuration, and other utility functions.
 * @returns Express middleware.
 */
const factory = async (trifid) => {
  const { config } = trifid
  const { module, options } = config
  if (!module) {
    throw new Error("configuration is missing 'module' field")
  }

  const middleware = await loader(module)

  return middleware(options)
}

export default factory
