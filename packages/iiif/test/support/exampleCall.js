import jsonld from 'jsonld'
import rdf from 'rdf-ext'
import SparqlHttpClient from 'sparql-http-client'
import frame from '../../src/frame.js'
import { createApi } from '../../src/iiif.js'

const client = new SparqlHttpClient({
  endpointUrl: 'https://data.ptt-archiv.ch/query',
})

const clientOptions = {
  operation: 'postUrlencoded',
}

const api = createApi(client, clientOptions)
const url = 'https://data.ptt-archiv.ch/archive/instantiation/CH-000525-4%3Aaip-01-0000203993-0001/manifest'
const iri = rdf.namedNode(url)

async function tryOut () {
  if (api.exists(iri)) {
    const dataset = await api.getBasicDataset(iri)
    const augmented = await api.augmentDataset(dataset)
    const doc = await jsonld.fromRDF(augmented, {})
    const framed = await frame(doc)
    // eslint-disable-next-line no-console
    console.log(framed)
  } else {
    // eslint-disable-next-line no-console
    console.log('boo')
  }
}

// @TODO make tests based on this
tryOut()
