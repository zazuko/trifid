const express = require('express')
const rdf = require('rdf-ext')
const debug = require('debug')('ckan:')

async function importAPI (clientConfig) {
  const { createAPI } = await import('ckan.js')
  return createAPI(clientConfig)
}

async function ckan (path, configs) {
  const router = express.Router()

  if (!configs || !configs.endpointUrl) {
    debug('Warning: no endpoint configured, module not mounted')
    return router
  }

  const { fetchDatasets, toXML } = await importAPI({
    endpointUrl: configs.endpointUrl,
    user: configs.user,
    password: configs.password
  })

  router.get(path, async (req, res) => {
    const organization = req.query.organization
    if (!organization) {
      return res.status(400).send('Missing `organization` query param')
    }

    try {
      const uri = rdf.namedNode(organization)

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
  return this.middleware.mountAll(router, configs, async (path) => {
    return await ckan(path, configs)
  })
}

module.exports = factory
