import { parentPort } from 'node:worker_threads'
import rdf from '@zazuko/env-node'
import sd from '@vocabulary/sd'
import fsd from './fetchServiceDescription.js'

const serviceDescriptionVocab = rdf.clownface({
  dataset: rdf.dataset(sd({ factory: rdf })),
})

const allowedProperties = rdf.termSet(
  serviceDescriptionVocab
    .has(rdf.ns.rdf.type, rdf.ns.rdf.Property)
    .terms,
)

const cbd = ({ level, quad: { predicate, subject } }) => {
  if (level === 0) {
    return !predicate.equals(rdf.ns.sd.endpoint) && allowedProperties.has(predicate)
  }

  return subject.termType === 'BlankNode'
}

parentPort.once('message', async (message) => {
  const { type, data: { endpointUrl, serviceDescriptionTimeout, ...rest } } = message
  if (type === 'config') {
    const timeout = setTimeout(() => {
      parentPort.postMessage({
        type: 'serviceDescriptionTimeOut',
      })
    }, serviceDescriptionTimeout)

    try {
      const dataset = await fsd.fetchServiceDescription(endpointUrl, {
        headers: rest.headers,
        format: rest.serviceDescriptionFormat,
      })
      clearTimeout(timeout)

      let service = rdf.clownface({ dataset })
        .has(rdf.ns.sd.endpoint, rdf.namedNode(endpointUrl))

      const traverser = rdf.traverser(cbd)
      service = rdf.clownface({
        term: service.term,
        dataset: traverser.match(service),
      })
        .addOut(rdf.ns.rdf.type, rdf.ns.sd.Service)

      parentPort.postMessage({
        type: 'serviceDescription',
        data: await service.dataset.serialize({ format: 'application/n-triples' }),
      })
    } catch (error) {
      clearTimeout(timeout)
      parentPort.postMessage({
        type: 'serviceDescriptionError',
        data: error,
      })
    }
  }
})
