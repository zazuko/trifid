import { parentPort } from 'node:worker_threads';
import rdf from '@zazuko/env-node';
import sd from '@vocabulary/sd';

import type { Term } from '@rdfjs/types';

import fsd from './fetchServiceDescription.ts';

if (!parentPort) {
  throw new Error('This module must be run as a worker thread');
}
const port = parentPort;

const serviceDescriptionVocab = rdf.clownface({
  dataset: rdf.dataset(sd({ factory: rdf })),
});

const allowedProperties = rdf.termSet(
  serviceDescriptionVocab
    .has(rdf.ns.rdf.type, rdf.ns.rdf.Property)
    .terms,
);

const cbd = ({ level, quad: { predicate, subject } }: { level: number; quad: { predicate: Term; subject: Term } }) => {
  if (level === 0) {
    return !predicate.equals(rdf.ns.sd.endpoint) && allowedProperties.has(predicate);
  }

  return subject.termType === 'BlankNode';
};

port.once('message', async (message) => {
  const { type, data: { endpointUrl, serviceDescriptionTimeout, ...rest } } = message;
  if (type === 'config') {
    const timeout = setTimeout(() => {
      port.postMessage({
        type: 'serviceDescriptionTimeOut',
      });
    }, serviceDescriptionTimeout);

    try {
      const dataset = await fsd.fetchServiceDescription(endpointUrl, {
        headers: rest.headers,
        format: rest.serviceDescriptionFormat,
      });
      clearTimeout(timeout);

      // `service` walks through several clownface pointer shapes; the clownface
      // generics are too strict to model this faithfully, so it stays loose.
      let service: any = rdf.clownface({ dataset })
        .has(rdf.ns.sd.endpoint, rdf.namedNode(endpointUrl));

      const traverser = rdf.traverser(cbd);
      service = rdf.clownface({
        term: service.term,
        dataset: traverser.match(service),
      })
        .addOut(rdf.ns.rdf.type, rdf.ns.sd.Service);

      port.postMessage({
        type: 'serviceDescription',
        data: await service.dataset.serialize({ format: 'application/n-triples' }),
      });
    } catch (error) {
      clearTimeout(timeout);
      port.postMessage({
        type: 'serviceDescriptionError',
        data: error,
      });
    }
  }
});
