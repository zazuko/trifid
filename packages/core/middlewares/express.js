import { loader } from '../lib/middlewares/loader.js'

/**
 * Import a plain Express middleware.
 *
 * Configuration fields:
 *  - module (string, required): the name of the NPM module to load
 *
 * @param {*} trifid Trifid object containing the configuration, and other utility functions.
 * @returns Express middleware.
 */
const factory = async (trifid) => {
  const { config } = trifid
  const { module } = config
  if (!module) {
    throw new Error("configuration is missing 'module' field")
  }

  const middleware = await loader(module)

  return middleware()
}

export default factory
