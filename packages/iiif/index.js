const SparqlHttpClient = require('sparql-http-client')
const express = require('express')
const debug = require('debug')('iiif:')
const createApi = require('./src/iiif.js')
const rdf = require('rdf-ext')
const jsonld = require('jsonld')
const frame = require('./src/frame.js')

function middleware (api) {

  return async (req, res, next) => {
    // @TODO discuss interface, should it be a parameter?
    // const uri = req.query.organization
    // if (!uri) {
    //   return res.status(400).send('Missing `uri` query param')
    // }
    const url = req.url
    debug(`url: ${url}`)
    if (req.method !== 'GET') return next()
    
    const iri = rdf.namedNode(url)
    if (!await api.exists(iri)) {
      debug(`iri: ${iri} not found`)
      return next()
    }

    const dataset = await api.getBasicDataset(iri)
    const augmented = await api.augmentDataset(dataset)
    const doc = await jsonld.fromRDF(augmented, {})
    const framed = await frame(doc)

    res.send(framed)
  }

}

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
  debug('Created API')

  router.get(path, middleware(api))
  return router
}

function factory (router, options) {
  return this.middleware.mountAll(router, options, async (path) => {
    return await iiif(path, options)
  })
}

module.exports = factory
