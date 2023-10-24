// @ts-check
import { createAPI } from './ckan.js'
import rdf from '@zazuko/env'

const factory = (trifid) => {
  const { config, logger } = trifid

  const { endpointUrl, user, password } = config
  const configuredEndpoint = endpointUrl || '/query'

  return async (req, res, _next) => {
    const endpoint = new URL(configuredEndpoint, req.absoluteUrl())
    const { fetchDatasets, toXML } = createAPI({
      endpointUrl: endpoint,
      user,
      password
    })

    const organization = req?.query?.organization
    if (!organization) {
      return res.status(400).send('Missing `organization` query param')
    }

    logger.debug(`asked for the '${organization}' organization`)

    try {
      const uri = rdf.namedNode(organization)

      const dataset = await fetchDatasets(uri)
      const xml = toXML(dataset)

      const format = 'application/rdf+xml'
      res.setHeader('Content-Type', format)

      return res.send(xml.toString())
    } catch (e) {
      logger.error(e)
      return res.status(500).send('Error')
    }
  }
}

export default factory
