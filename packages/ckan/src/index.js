import { createAPI } from './ckan.js'
import rdf from 'rdf-ext'

const factory = (trifid) => {
  const { config, logger } = trifid

  const { endpointUrl, user, password } = config
  if (!endpointUrl) {
    throw new Error("configuration is missing 'endpointUrl' field")
  }

  return async (req, res, _next) => {
    const { fetchDatasets, toXML } = createAPI({
      endpointUrl,
      user,
      password
    })

    const organization = req?.query?.organization
    if (!organization) {
      return res.status(400).send('Missing `organization` query param')
    }

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
