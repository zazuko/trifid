import clownface from 'clownface'
import rdf from 'rdf-ext'
import through2 from 'through2'
import ns from './ns.js'
import queries from './queries.js'

const fixBlankNodes = () =>
  through2.obj((chunk, _enc, callback) => {
    // Fix the blank nodes prefixes
    if (chunk.subject.termType === 'BlankNode') {
      chunk.subject.value = `_:${chunk.subject.value}`
    }
    if (chunk.object.termType === 'BlankNode') {
      chunk.object.value = `_:${chunk.object.value}`
    }
    callback(null, chunk)
  })

const filterOutAsItems = () =>
  through2.obj((chunk, _enc, callback) => {
    if (chunk.predicate.value === ns.as.items.value) {
      callback(null)
    } else {
      callback(null, chunk)
    }
  })

function createApi (client, clientOptions) {
  async function exists (iri) {
    const query = queries.manifestExists(iri)
    return await client.query.ask(query, clientOptions)
  }

  async function getBasicDataset (iri) {
    const dataset = rdf.dataset()
    const query = queries.discoverManifest(iri)
    const stream = await client.query.construct(query, clientOptions)
    await dataset.import(stream.pipe(fixBlankNodes()))
    return dataset
  }

  async function augmentDataset (dataset) {
    const ptr = clownface({ dataset })

    // Find all important nodes
    const nodes = ptr.has(ns.rdf.type, [
      ns.iiif_prezi.Manifest,
      ns.iiif_prezi.Canvas,
      ns.as.OrderedCollectionPage,
      ns.oa.Annotation,
      ns.dctypes.StillImage,
      ns.dctypes.MovingImage,
    ]).terms

    // And describe them
    const stream = await client.query.construct(queries.describeNodes(nodes), clientOptions)
    await dataset.import(stream.pipe(fixBlankNodes()).pipe(filterOutAsItems()))
    return dataset
  }

  return {
    exists,
    getBasicDataset,
    augmentDataset,
  }
}

export { createApi }
