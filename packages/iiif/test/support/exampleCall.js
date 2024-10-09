/* eslint-disable no-console */

import jsonld from 'jsonld'
import rdf from '@zazuko/env'
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

const tryOut = async () => {
  if (api.exists(iri)) {
    const dataset = await api.getBasicDataset(iri)
    const augmented = await api.augmentDataset(dataset)
    const doc = await jsonld.fromRDF(augmented, {})
    const framed = await frame(doc)
    console.log(framed)
  } else {
    console.log('boo')
  }
}

// @TODO make tests based on this
tryOut()
