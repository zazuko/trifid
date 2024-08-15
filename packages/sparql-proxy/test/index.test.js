import * as fs from 'node:fs'
import { expect } from 'chai'
import trifidCore, { getListenerURL } from 'trifid-core'
import rdf from '@zazuko/env-node'
import sinon from 'sinon'
import sparqlProxy from '../index.js'

describe('sparql-proxy', () => {
  let trifidListener

  async function startTrifid(config) {
    const server = await trifidCore({
      server: {
        listener: {
          port: 4242,
        },
        logLevel: 'warn',
      },
    }, {
      sparqlProxy: {
        module: sparqlProxy,
        config: {
          endpointUrl: 'http://example.com/sparql',
          ...config,
        },
      },
    })

    trifidListener = await server.start()
    return getListenerURL(trifidListener)
  }
  afterEach(async () => {
    await trifidListener?.close()
  })

  it('should start in a timely manner', async () => {
    await startTrifid()
  })

  context('requesting service description', () => {
    const serviceDescription = fs.readFileSync(new URL('support/serviceDescription.ttl', import.meta.url), 'utf-8')

    const forwardedProperties = rdf.termMap([
      [rdf.ns.sd.feature],
    ])

    let proxiedFetch
    beforeEach(() => {
      proxiedFetch = sinon.stub().callsFake(async () => {
        return new Response(serviceDescription, {
          headers: {
            'content-type': 'text/turtle',
          },
        })
      })
    })

    for (const [property] of forwardedProperties) {
      if (rdf.ns.sd.endpoint.equals(property)) continue

      it(`should forward standard property ${property.value}`, async () => {
        // given
        const url = await startTrifid({
          fetch: proxiedFetch,
        })

        // when
        const response = await rdf.fetch(`${url}/query`)
        const dataset = await response.dataset()

        // then
        const service = rdf.clownface({ dataset }).has(rdf.ns.sd.endpoint)
        expect(service.out(property).values).to.have.property('length').greaterThan(0)
      })
    }

    it('replaces endpoint URL', async () => {
      // given
      const url = await startTrifid({
        fetch: proxiedFetch,
      })

      // when
      const response = await rdf.fetch(`${url}/query`)
      const dataset = await response.dataset()

      // then
      const service = rdf.clownface({ dataset }).has(rdf.ns.sd.endpoint)
      expect(service.out(rdf.ns.sd.endpoint).term).to.deep.eq(rdf.namedNode(`${url}/query`))
    })

    for (const property of [rdf.namedNode('http://example.org/foo', rdf.ns.sd.nonStandardProp)]) {
      it(`removes non-standard property ${property.value}`, async () => {
        // given
        const url = await startTrifid({
          fetch: proxiedFetch,
        })

        // when
        const response = await rdf.fetch(`${url}/query`)
        const dataset = await response.dataset()

        // then
        const service = rdf.clownface({ dataset }).has(rdf.ns.sd.endpoint)
        expect(service.out(property).terms).to.have.length(0)
      })
    }

    it('copies deep subtrees', async () => {
      // given
      const url = await startTrifid({
        fetch: proxiedFetch,
      })

      // when
      const response = await rdf.fetch(`${url}/query`)
      const dataset = await response.dataset()

      // then
      const service = rdf.clownface({ dataset }).has(rdf.ns.sd.endpoint)
      const actual = service
        .out(rdf.ns.sd.defaultDataset)
        .out(rdf.ns.sd.namedGraph)
        .out(rdf.ns.sd.graph)
        .out(rdf.ns._void.triples)
      expect(actual.term).to.deep.eq(rdf.literal('2000', rdf.ns.xsd.integer))
    })

    it('serves service description from memory', async () => {
      // given
      const url = await startTrifid({
        fetch: proxiedFetch,
      })

      // when
      await rdf.fetch(`${url}/query`)

      // then
      expect(proxiedFetch).not.to.have.been.called
    })
  })
})
