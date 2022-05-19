import jsonld from 'jsonld'
import rdf from 'rdf-ext'
import SparqlHttpClient from 'sparql-http-client'
import frame from './src/frame.js'
import { createApi } from './src/iiif.js'

function createMiddleware (api, options = {}, logger = str => console.log(str)) {
  const { uriPrefix } = options

  return async (req, res, next) => {
    const url = req.url
    if (req.method !== 'GET') {
      return next()
    }

    if (!(uriPrefix || req.query.uri)) {
      logger('No uri query parameter')
      return next()
    }

    const uri = uriPrefix ? rdf.namedNode(`${uriPrefix}${url}`) : rdf.namedNode(req.query.uri)

    if (!await api.exists(uri)) {
      logger(`uri: ${uri} not found`)
      return next()
    }
    logger(`fetching uri: ${uri}`)

    const dataset = await api.getBasicDataset(uri)
    const augmented = await api.augmentDataset(dataset)
    const doc = await jsonld.fromRDF(augmented, {})
    const framed = await frame(doc)

    res.send(framed)
  }
}

function trifidFactory (trifid) {
  const { config, logger } = trifid

  if (!config || !config.endpointUrl) {
    throw Error('missing endpointUrl parameter')
  }
  const client = new SparqlHttpClient({
    endpointUrl: config.endpointUrl,
    user: config.endpointUser,
    password: config.endpointPassword
  })

  const api = createApi(client, {
    operation: 'postUrlencoded'
  })
  const uriPrefix = config.uriPrefix ? config.uriPrefix : ''

  return createMiddleware(api, { uriPrefix }, logger)
}

export default trifidFactory
export { createMiddleware }
