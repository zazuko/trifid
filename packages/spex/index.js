import absoluteUrl from 'absolute-url'
import express from 'express'
import path, { dirname } from 'path'
import url, { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const defaults = {
  template: path.join(__dirname, 'views/index.hbs')
}

const defaultOptions = {
  url: null,
  user: null,
  password: null,
  graph: null,
  prefixes: [],
  forceIntrospection: false
}

const createMiddleWare = (config, render) => {
  const router = express.Router()

  const options = { ...defaultOptions, ...(config.options || {}) }
  config = { ...defaults, ...config, options }

  // render index page
  router.get('/', async (req, res) => {
    // Enforce trailing slash to ensure that static files are served from the correct URL
    if (!req.originalUrl.endsWith('/')) {
      return res.redirect(req.originalUrl + '/')
    }

    absoluteUrl.attach(req)

    // Create an absolute URL if a relative URL is provided
    options.url = (new url.URL(options.url, req.absoluteUrl())).toString()

    res.send(await render(config.template, {
      options: JSON.stringify(options)
    }, {
      title: 'SPEX'
    }))
  })

  // static files from spex dist folder
  const yasguiPath = new URL('node_modules/@zazuko/spex/dist', import.meta.url).pathname
  router.use('/static/', express.static(yasguiPath))
  return router
}

const trifidFactory = (trifid) => {
  const { config, render } = trifid
  return createMiddleWare(config, render)
}

export default trifidFactory
export { createMiddleWare }
