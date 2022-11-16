/* global describe, it, beforeEach, afterEach */

import assert from 'assert'
import rdfHttpHandler from '../index.js'
import { createApp } from './support/test-instance.js'

describe('rdf-http-handler', () => {
  let server
  beforeEach(async () => {
    const app = await createApp(
      { configFilePath: './test/support/config.yaml', port: 3000 })
    server = app.listen(3000, function () {})
  })

  afterEach(() => {
    server.close()
  })

  it('should be a function', () => {
    assert.strictEqual(typeof rdfHttpHandler, 'function')
  })

  it('should proxy RDF without redirects', async () => {
    const res = await fetch('http://localhost:3000/alice')
    const jsonld = await res.json()

    assert.strictEqual(res.status, 200)
    assert(Array.isArray(jsonld))
    assert(jsonld.length > 0)
    assert.strictEqual(jsonld[0]['@id'], 'http://localhost:3000/alice')
  })

  for (const mediaType of [
    'application/json', 'application/ld+json', // 'application/trig',
    'application/n-quads', 'application/n-triples', 'text/n3', 'text/turtle'
    // 'application/rdf+xml'
  ]) {
    it(`should proxy RDF without redirects,  'Accept': '${mediaType}'`,
      async () => {
        const res = await fetch('http://localhost:3000/alice', {
          headers: {
            Accept: mediaType
          }
        })
        const text = await res.text()

        assert.strictEqual(res.status, 200)
        assert(text.length > 0)
        assert(text.indexOf('http://localhost:3000/alice' > 1), true)
      })
  }

  it('should proxy a 404', async () => {
    const res = await fetch('http://localhost:3000/unknown')

    assert.strictEqual(res.status, 404)
  })

  it('should redirect when data has redirects', async () => {
    const res = await fetch('http://localhost:3000/req')

    const jsonld = await res.json()

    assert.strictEqual(res.status, 200)
    assert(Array.isArray(jsonld))
    assert(jsonld.length > 0)
    assert.strictEqual(jsonld[0]['@id'], 'http://localhost:3000/bob')
  })
})
