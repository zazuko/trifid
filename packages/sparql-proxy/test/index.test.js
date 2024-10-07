import { expect } from 'chai'
import trifidCore, { getListenerURL } from 'trifid-core'
import rdf from '@zazuko/env-node'
import { stub, restore } from 'sinon'
import sparqlProxy from '../index.js'

describe('sparql-proxy', () => {
  let trifidListener
  let defaultTestConfig

  const startTrifid = async (config) => {
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
          ...defaultTestConfig,
          ...config,
        },
      },
    })

    trifidListener = await server.start()
    return getListenerURL(trifidListener)
  }

  beforeEach(() => {
    defaultTestConfig = {
      endpointUrl: 'http://example.com/sparql',
      serviceDescriptionWorkerUrl: new URL('./support/workerDouble.js', import.meta.url),
      serviceDescriptionTimeout: 1000,
    }
  })
  afterEach(async () => {
    await trifidListener?.close()
  })

  it('should start in a timely manner', async () => {
    await startTrifid()
  })

  context('requesting service description', () => {
    const forwardedProperties = rdf.termMap([
      [rdf.ns.sd.feature],
    ])

    beforeEach(() => {
      stub(global, 'fetch')
    })

    afterEach(() => {
      restore()
    })

    it('does not serve Service Description when there are any query string', async () => {
      // given
      const url = await startTrifid({
        serviceDescriptionTimeout: 0,
      })

      // when
      const response = await rdf.fetch(`${url}/query?foo=bar`)

      // then
      expect(response.headers.get('content-type')).to.match(/^(text\/plain|application\/json).*/)
    })

    for (const [property] of forwardedProperties) {
      if (rdf.ns.sd.endpoint.equals(property)) continue

      it(`should forward standard property ${property.value}`, async () => {
        // given
        const url = await startTrifid()

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
      const url = await startTrifid()

      // when
      for (const path of ['query', 'query/']) {
        const response = await rdf.fetch(`${url}/${path}`)
        const dataset = await response.dataset()

        // then
        const service = rdf.clownface({ dataset }).has(rdf.ns.sd.endpoint)
        expect(service.out(rdf.ns.sd.endpoint).term).to.deep.eq(rdf.namedNode(`${url}/${path}`))
      }
    })

    it('serves minimal description if original service is too slow', async () => {
      // given
      const url = await startTrifid({
        serviceDescriptionTimeout: 0,
      })

      // when
      const response = await rdf.fetch(`${url}/query`)
      const dataset = await response.dataset()

      // then
      const service = rdf.clownface({ dataset }).has(rdf.ns.sd.endpoint)
      expect(service.out(rdf.ns.sd.endpoint).term).to.deep.eq(rdf.namedNode(`${url}/query`))
    })

    it('serves minimal description if original service fails', async () => {
      // given
      const url = await startTrifid({
        serviceDescriptionWorkerUrl: new URL('./support/failingWorker.js', import.meta.url),
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
        const url = await startTrifid()

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
      const url = await startTrifid()

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
      const url = await startTrifid()

      // when
      await rdf.fetch(`${url}/query`)

      // then
      expect(fetch).not.to.have.been.called
    })

    it('respects content negotiation', async () => {
      // given
      const url = await startTrifid()

      // when
      const response = await rdf.fetch(`${url}/query`, {
        headers: {
          accept: 'text/turtle',
        },
      })

      // then
      expect(response.headers.get('content-type')).to.eq('text/turtle')
    })

    context('against a real SPARQL endpoint', () => {
      beforeEach(() => {
        defaultTestConfig = {
          endpointUrl: 'https://dbpedia.org/sparql',
          serviceDescriptionTimeout: 10000,
          // dbpedia does not do content negotiation 🙄
          serviceDescriptionFormat: 'text/turtle',
        }
      })

      it('should work', async () => {
        // given
        const url = await startTrifid()

        // when
        const response = await rdf.fetch(`${url}/query`)
        const dataset = await response.dataset()

        // then
        expect(dataset).to.have.property('size').greaterThan(2)
      }).timeout(10000)
    })
  })
})
