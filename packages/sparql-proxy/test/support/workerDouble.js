import { fileURLToPath } from 'node:url'
import rdf from '@zazuko/env-node'

import fsd from '../../lib/fetchServiceDescription.js'

const serviceDescriptionPath = fileURLToPath(new URL('./serviceDescription.ttl', import.meta.url))

fsd.fetchServiceDescription = async (_endpointUrl, _opts) => {
  return rdf.dataset().import(rdf.fromFile(serviceDescriptionPath))
}

import('../../lib/serviceDescriptionWorker.js')
