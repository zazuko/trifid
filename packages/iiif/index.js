/* eslint-disable no-console */

import jsonld from 'jsonld'
import rdf from '@zazuko/env'
import SparqlHttpClient from 'sparql-http-client'
import frame from './src/frame.js'
import { createApi } from './src/iiif.js'

const trifidFactory = async (trifid) => {
  const { config, logger } = trifid

  if (!config || !config.endpointUrl) {
    throw Error('missing endpointUrl parameter')
  }
  const client = new SparqlHttpClient({
    endpointUrl: config.endpointUrl,
    user: config.endpointUser,
    password: config.endpointPassword,
  })

  const api = createApi(client, {
    operation: 'postUrlencoded',
  })
  const uriPrefix = config.uriPrefix ? config.uriPrefix : ''

  return {
    defaultConfiguration: async () => {
      return {
        methods: ['GET'],
        paths: [
          '/iiif/',
        ],
      }
    },
    routeHandler: async () => {
      /**
       * Route handler.
       * @param {import('fastify').FastifyRequest} request Request.
       * @param {import('fastify').FastifyReply} reply Reply.
       */
      const handler = async (request, reply) => {
        let requestPort = ''
        if (request.port) {
          requestPort = `:${request.port}`
        }
        const fullUrl = `${request.protocol}://${request.hostname}${requestPort}${request.url}`
        const fullUrlObject = new URL(fullUrl)
        const fullUrlPathname = fullUrlObject.pathname

        if (!(uriPrefix || request.query.uri)) {
          logger.debug('No uri query parameter')
          reply.callNotFound()
          return reply
        }

        const uri = uriPrefix ? rdf.namedNode(`${uriPrefix}${fullUrlPathname}`) : rdf.namedNode(request.query.uri)
        logger.debug(`uri: ${uri.value}`)
        if (!await api.exists(uri)) {
          logger.debug(`uri: ${uri} not found`)
          reply.callNotFound()
          return reply
        }
        logger.debug(`fetching uri: ${uri}`)

        const dataset = await api.getBasicDataset(uri)
        const augmented = await api.augmentDataset(dataset)
        const doc = await jsonld.fromRDF(augmented, {})
        const framed = await frame(doc)

        reply.send(framed)
        return reply
      }
      return handler
    },
  }
}

export default trifidFactory
