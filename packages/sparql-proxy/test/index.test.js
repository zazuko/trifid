import { describe, it, beforeEach, afterEach } from 'node:test'
import { equal, deepEqual, match, ok } from 'node:assert'
import trifidCore, { getListenerURL } from 'trifid-core'
import rdf from '@zazuko/env-node'
import sparqlProxy from '../index.js'

describe('sparql-proxy', () => {
  let trifidListener
  let defaultTestConfig

  const startTrifid = async (config) => {
    const server = await trifidCore({
      server: {
        listener: {
          port: 0,
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

  describe('requesting service description', () => {
    const forwardedProperties = rdf.termMap([
      [rdf.ns.sd.feature],
    ])

    it('does not serve Service Description when there are any query string', async () => {
      // given
      const url = await startTrifid({
        serviceDescriptionTimeout: 0,
      })

      // when
      const response = await rdf.fetch(`${url}/query?foo=bar`)

      // then
      match(response.headers.get('content-type'), /^(text\/plain|text\/html|application\/json).*/)
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
        ok(service.out(property).values.length > 0)
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
        deepEqual(service.out(rdf.ns.sd.endpoint).term, rdf.namedNode(`${url}/${path}`))
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
      deepEqual(service.out(rdf.ns.sd.endpoint).term, rdf.namedNode(`${url}/query`))
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
      deepEqual(service.out(rdf.ns.sd.endpoint).term, rdf.namedNode(`${url}/query`))
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
        equal(service.out(property).terms.length, 0)
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
      deepEqual(actual.term, rdf.literal('2000', rdf.ns.xsd.integer))
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
      equal(response.headers.get('content-type'), 'text/turtle')
    })
  })
})
