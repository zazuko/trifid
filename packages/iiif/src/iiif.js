const queries = require('./queries.js')
const ns = require('./ns.js')
const rdf = require('rdf-ext')
const clownface = require('clownface')
const through2 = require('through2')

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

const createApi = (client, clientOptions) => {
  const exists = async (iri) => {
    return await client.query.ask(queries.manifestExists(iri), clientOptions)
  }

  const getBasicDataset = async (iri) => {
    const dataset = rdf.dataset()
    const query = queries.discoverManifest(iri)
    const stream = await client.query.construct(query, clientOptions)
    await dataset.import(stream.pipe(fixBlankNodes()))
    return dataset
  }

  const augmentDataset = async (dataset) => {
    const ptr = clownface({ dataset })

    // Find all important nodes
    const nodes = ptr.has(ns.rdf.type, [
      ns.iiifPrezi.Manifest,
      ns.iiifPrezi.Canvas,
      ns.as.OrderedCollectionPage,
      ns.oa.Annotation,
      ns.dctypes.StillImage,
      ns.dctypes.MovingImage
    ]).terms

    // And describe them
    const stream = await client.query.construct(queries.describeNodes(nodes), clientOptions)
    await dataset.import(stream.pipe(fixBlankNodes()).pipe(filterOutAsItems()))
    return dataset
  }

  return {
    exists,
    getBasicDataset,
    augmentDataset
  }
}

module.exports = createApi
