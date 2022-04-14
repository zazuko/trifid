const SparqlHttpClient = require('sparql-http-client')
const express = require('express')
const debug = require('debug')('iiif:')
const createApi = require ('./iiif.js')
const rdf = require('rdf-ext')
const jsonld = require('jsonld')
const frame = require('./frame.js')

async function iiif (path, configs) {

  const router = express.Router()

  if (!configs || !configs.endpointUrl) {
    debug('Warning: no endpoint configured, module not mounted')
    return router
  }

  const client = new SparqlHttpClient({
    endpointUrl: configs.endpointUrl,
    user: configs.endpointUser,
    password: configs.endpointPassword,
  })

  const clientOptions = {
    operation: 'postUrlencoded',
  }
  const api = createApi(client, clientOptions)

  router.get(path, async (req, res) => {

    // @TODO discuss interface, should it be a parameter?
    // const uri = req.query.organization
    // if (!uri) {
    //   return res.status(400).send('Missing `uri` query param')
    // }

    const url = req.absoluteUrl()

    if (req.method !== 'GET') return next()

    const iri = rdf.namedNode(url)
    if (!await api.exists(iri)) {
      return next()
    }

    const dataset = await api.getBasicDataset(iri)
    const augmented = await api.augmentDataset(dataset)
    const doc = await jsonld.fromRDF(augmented, {})
    const framed = await frame(doc)

    res.send(framed)
  })

  return router
}

function factory (router, configs) {
  return this.middleware.mountAll(router, configs, async (path) => {
    return await iiif(path, configs)
  })
}

module.exports = factory
