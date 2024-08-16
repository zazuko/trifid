import * as url from 'node:url'
import sinon from 'sinon'
import rdf from '@zazuko/env-node'
import fetch from '../../lib/fetchServiceDescription.js'

const serviceDescriptionPath = url.fileURLToPath(new URL('./serviceDescription.ttl', import.meta.url))

fetch.fetchServiceDescription = sinon.stub().callsFake(async () => {
  return rdf.dataset().import(rdf.fromFile(serviceDescriptionPath))
})

import('../../lib/serviceDescriptionWorker.js')
