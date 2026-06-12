import rdf from '@zazuko/env';
import through2 from 'through2';

import type { Quad, Term } from '@rdfjs/types';
import type SparqlClient from 'sparql-http-client';

import ns from './ns.ts';
import queries from './queries.ts';

type Through2Callback = (error?: Error | null, data?: Quad | null) => void;

const fixBlankNodes = () =>
  through2.obj((chunk: Quad, _enc: string, callback: Through2Callback) => {
    // Fix the blank nodes prefixes
    if (chunk.subject.termType === 'BlankNode') {
      chunk.subject.value = `_:${chunk.subject.value}`;
    }
    if (chunk.object.termType === 'BlankNode') {
      chunk.object.value = `_:${chunk.object.value}`;
    }
    callback(null, chunk);
  });

const filterOutAsItems = () =>
  through2.obj((chunk: Quad, _enc: string, callback: Through2Callback) => {
    if (chunk.predicate.value === ns.as.items.value) {
      callback(null);
    } else {
      callback(null, chunk);
    }
  });

interface ClientOptions {
  operation?: 'get' | 'postUrlencoded' | 'postDirect';
}

const createApi = (client: SparqlClient, clientOptions: ClientOptions) => {
  const exists = async (iri: Term) => {
    const query = queries.manifestExists(iri);
    return await client.query.ask(query, clientOptions);
  };

  const getBasicDataset = async (iri: Term) => {
    const dataset = rdf.dataset();
    const query = queries.discoverManifest(iri);
    const stream = await client.query.construct(query, clientOptions);
    await dataset.import(stream.pipe(fixBlankNodes()));
    return dataset;
  };

  const augmentDataset = async (dataset: ReturnType<typeof rdf.dataset>) => {
    const ptr = rdf.clownface({ dataset });

    // Find all important nodes (the namespace proxies are typed as possibly
    // `undefined` under `noUncheckedIndexedAccess`, but always resolve at runtime)
    const nodes = ptr.has(ns.rdf.type as Term, [
      ns.iiifPrezi.Manifest,
      ns.iiifPrezi.Canvas,
      ns.as.OrderedCollectionPage,
      ns.oa.Annotation,
      ns.dctypes.StillImage,
      ns.dctypes.MovingImage,
    ] as Term[]).terms;

    // And describe them
    const stream = await client.query.construct(queries.describeNodes(nodes), clientOptions);
    await dataset.import(stream.pipe(fixBlankNodes()).pipe(filterOutAsItems()));
    return dataset;
  };

  return {
    exists,
    getBasicDataset,
    augmentDataset,
  };
};

export { createApi };
