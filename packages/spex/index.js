import absoluteUrl from 'absolute-url'
import express from 'express'
import path, { dirname } from 'path'
import url, { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const defaults = {
  template: path.join(__dirname, 'views/index.html')
}

const defaultOptions = {
  url: null,
  user: null,
  password: null,
  graph: null,
  prefixes: [],
  forceIntrospection: false
}

function createMiddleWare (config, logger = (str) => console.log(str)) {
  const router = express.Router()

  const options = { ...defaultOptions, ...(config.options || {}) }
  config = { ...defaults, ...config, options }

  // render index page
  router.get('/', (req, res) => {
    // Enforce trailing slash to ensure that static files are served from the correct URL
    if (!req.originalUrl.endsWith('/')) {
      return res.redirect(req.originalUrl + '/')
    }

    absoluteUrl.attach(req)

    // Create an absolute URL if a relative URL is provided
    options.url = (new url.URL(options.url, req.absoluteUrl())).toString()

    res.locals.options = JSON.stringify(options)

    res.render(config.template)
  })

  // static files from spex dist folder
  const yasguiPath = new URL('node_modules/@zazuko/spex', import.meta.url).pathname
  router.use('/static/', express.static(yasguiPath))
  return router
}

function trifidFactory (trifid) {
  const { config, logger } = trifid
  return createMiddleWare(config, logger)
}

export default trifidFactory
export { createMiddleWare }
