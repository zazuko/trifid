import absoluteUrl from 'absolute-url'
import { resolve } from 'import-meta-resolve'
import express from 'express'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

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

const createMiddleWare = async (config, render) => {
  const router = express.Router()

  const options = { ...defaultOptions, ...(config || {}) }
  config = { ...defaults, ...config, options }

  // render index page
  router.get('/', async (req, res) => {
    // Enforce trailing slash to ensure that static files are served from the correct URL
    if (!req.originalUrl.endsWith('/')) {
      return res.redirect(req.originalUrl + '/')
    }

    absoluteUrl.attach(req)

    // Create an absolute URL if a relative URL is provided
    options.url = (new URL(options.url || '/query', req.absoluteUrl())).toString()

    res.send(await render(config.template, {
      options: JSON.stringify(options),
      locals: res.locals
    }, {
      title: 'SPEX'
    }))
  })

  // static files from spex dist folder
  const distPath = await resolve('@zazuko/spex/dist', import.meta.url)
  router.use('/static/', express.static(distPath.replace(/^file:\/\//, '')))
  return router
}

const trifidFactory = async (trifid) => {
  const { config, render } = trifid
  return await createMiddleWare(config, render)
}

export default trifidFactory
export { createMiddleWare }
