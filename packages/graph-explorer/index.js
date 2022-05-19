import absoluteUrl from 'absolute-url'
import express from 'express'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function createMiddleWare (options, logger = str => console.log(str)) {
  const router = express.Router()

  if (!options || !options.endpointUrl) {
    return router
  }

  options.template = options.template || path.join(__dirname, 'views/index.html')
  options.acceptBlankNodes = !!options.acceptBlankNodes
  options.dataLabelProperty = options.dataLabelProperty || 'rdfs:label'
  options.schemaLabelProperty = options.schemaLabelProperty || 'rdfs:label'
  options.language = options.language || 'en'
  options.languages = options.languages || [
    { code: 'en', label: 'English' },
    { code: 'de', label: 'German' },
    { code: 'fr', label: 'French' },
    { code: 'it', label: 'Italian' }
  ]

  const graphExplorerPath = new URL('node_modules/graph-explorer/dist/', import.meta.url).pathname
  router.use('/dist/', express.static(graphExplorerPath))

  // render index page
  router.get('/', (req, res) => {
    absoluteUrl.attach(req)

    const urlPathname = new URL(req.originalUrl, req.absoluteUrl()).pathname

    // redirect to trailing slash URL for relative pathes of JS and CSS files
    if (urlPathname.slice(-1) !== '/') {
      return res.redirect(urlPathname + '/')
    }

    // read SPARQL endpoint URL from options and resolve with absoluteUrl
    res.locals.endpointUrl = new URL(options.endpointUrl, req.absoluteUrl()).href
    res.locals.acceptBlankNodes = options.acceptBlankNodes
    res.locals.dataLabelProperty = options.dataLabelProperty
    res.locals.schemaLabelProperty = options.schemaLabelProperty
    res.locals.language = options.language
    res.locals.languages = JSON.stringify(options.languages)

    res.render(options.template)
  })

  return router
}

function trifidFactory (trifid) {
  const { config, logger } = trifid

  return createMiddleWare(config, logger)
}

export default trifidFactory
export { createMiddleWare }
