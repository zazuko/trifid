// @ts-check

import rdf from '@zazuko/env'
import { createAPI } from './ckan.js'

/** @type {import('../../core/types/index.js').TrifidPlugin} */
const factory = async (trifid) => {
  const { config, logger } = trifid

  const { endpointUrl, user, password } = config
  const configuredEndpoint = endpointUrl || '/query'

  return {
    defaultConfiguration: async () => {
      return {
        methods: ['GET'],
        paths: ['/ckan'],
      }
    },
    routeHandler: async () => {
      /**
       * Query string type.
       *
       * @typedef {Object} QueryString
       * @property {string} [organization] The organization to fetch.
       */

      /**
       * Route handler.
       * @param {import('fastify').FastifyRequest<{Querystring: QueryString}>} request Request.
       * @param {import('fastify').FastifyReply} reply Reply.
       */
      const handler = async (request, reply) => {
        let requestPort = ''
        if (request.port) {
          requestPort = `:${request.port}`
        }
        const fullUrl = `${request.protocol}://${request.hostname}${requestPort}${request.url}`
        const endpoint = new URL(configuredEndpoint, fullUrl)
        const { fetchDatasets, toXML } = createAPI({
          endpointUrl: endpoint.toString(),
          user,
          password,
        })

        const organization = request.query?.organization
        if (!organization) {
          reply.status(400).send('Missing `organization` query param')
          return reply
        }

        logger.debug(`Asked for the '${organization}' organization`)

        try {
          const uri = rdf.namedNode(organization)

          const dataset = await fetchDatasets(uri)
          const xml = toXML(dataset)

          const format = 'application/rdf+xml'

          reply.type(format).send(xml.toString())
        } catch (e) {
          logger.error(e)
          reply.status(500).send('Error')
        }

        return reply
      }
      return handler
    },
  }
}

export default factory
