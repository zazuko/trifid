/**
 * Render a specific template file.
 *
 * Configuration fields:
 *  - path (string, required): the path to the template file to load
 *  - context (object, optional): context to give to this specific template file (some variables)
 *  - options (object, optional): options to pass to the Trifid render function (change the title of the page, …)
 *
 * @param {*} trifid Trifid object containing the configuration, and other utility functions.
 * @returns Express middleware.
 */
const factory = async (trifid) => {
  const { config, render } = trifid
  const { path } = config
  let { context, options } = config

  if (!path) {
    throw new Error("configuration is missing 'path' field")
  }

  if (!context) {
    context = {}
  }

  if (!options) {
    options = {}
  }

  return async (_req, res, _next) => {
    res.status(200)
    res.send(await render(path, { ...context, locals: res.locals }, options))
  }
}

export default factory
