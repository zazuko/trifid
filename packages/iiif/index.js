const SparqlHttpClient = require('sparql-http-client')
const express = require('express')
const debug = require('debug')('iiif:')
const createApi = require('./src/iiif.js')
const rdf = require('rdf-ext')
const jsonld = require('jsonld')
const frame = require('./src/frame.js')

function middleware (api, uriPrefix) {

  return async (req, res, next) => {
    const url = req.url
    if (req.method !== 'GET') return next()
    
    const iri = rdf.namedNode(`${uriPrefix}${url}`)
    if (!await api.exists(iri)) {
      debug(`iri: ${iri} not found`)
      return next()
    }
    debug(`fetching iri: ${iri}`)

    const dataset = await api.getBasicDataset(iri)
    const augmented = await api.augmentDataset(dataset)
    const doc = await jsonld.fromRDF(augmented, {})
    const framed = await frame(doc)

    res.send(framed)
  }

}

async function iiif (path, options) {

  const router = express.Router()
  if (!options || !options.endpointUrl) {
    debug('Warning: no endpoint configured, module not mounted')
    return router
  }
  const client = new SparqlHttpClient({
    endpointUrl: options.endpointUrl,
    user: options.endpointUser,
    password: options.endpointPassword,
  })

  const clientOptions = {
    operation: 'postUrlencoded',
  }
  const api = createApi(client, clientOptions)
  const uriPrefix = options.uriPrefix?options.uriPrefix:''

  router.get(path, middleware(api,uriPrefix))
  return router
}

function factory (router, options) {
  return this.middleware.mountAll(router, options, async (path) => {
    return await iiif(path, options)
  })
}

module.exports = factory
