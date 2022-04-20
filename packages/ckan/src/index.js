const express = require('express')
const rdf = import('rdf-ext')
const debug = require('debug')('ckan:')
const url = require('url')

async function importAPI (clientConfig) {
  const { createAPI } = await import('./ckan.mjs')
  return createAPI(clientConfig)
}

function middleware (options) {
  const router = express.Router()

  if (!options || !options.endpointUrl) {
    debug('Warning: no endpoint configured, module not mounted')
    return router
  }

  router.get('/', async (req, res) => {
    // Create an absolute URL if a relative URL is provided
    options.endpointUrl = (new url.URL(options.endpointUrl, req.absoluteUrl())).toString()

    const { fetchDatasets, toXML } = await importAPI({
      endpointUrl: options.endpointUrl,
      user: options.user,
      password: options.password
    })

    const organization = req.query.organization
    if (!organization) {
      return res.status(400).send('Missing `organization` query param')
    }

    try {
      const rdfResolved = await rdf
      const uri = rdfResolved.default.namedNode(organization)

      const dataset = await fetchDatasets(uri)
      const xml = await toXML(dataset)

      const format = 'application/rdf+xml'
      res.setHeader('Content-Type', format)

      return res.send(xml.toString())
    } catch (e) {
      debug(e)
      return res.status(500).send('Error')
    }
  })

  return router
}

function factory (router, configs) {
  return this.middleware.mountAll(router, configs, (config) => {
    return middleware(config)
  })
}

module.exports = factory
