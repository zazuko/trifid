import { strictEqual } from 'assert'
import withServer from 'express-as-promise/withServer.js'
import { describe, it } from 'mocha'
import { SparqlHandler } from '../index.js'
import { createEndpoint } from './support/createEndpoint.js'
import setIri from './support/setIri.js'

/* eslint-disable no-template-curly-in-string */
const defaults = {
  resourceExistsQuery: 'ASK { <${iri}> ?p ?o }',
  resourceGraphQuery: 'DESCRIBE <${iri}>',
  containerExistsQuery: 'ASK { ?s a ?o. FILTER REGEX(STR(?s), "^${iri}") }',
  containerGraphQuery: 'CONSTRUCT { ?s a ?o. } WHERE { ?s a ?o. FILTER REGEX(STR(?s), "^${iri}") }'
}
/* eslint-enable no-template-curly-in-string */

describe('trifid-handler-sparql', () => {
  it('should be a constructor', () => {
    strictEqual(typeof SparqlHandler, 'function')
  })

  describe('uses the resourceExistsQuery to check if the requested IRI exists', async () => {
    [
      { iri: 'http://localhost/test', resourceNoSlash: undefined },
      { iri: 'http://localhost/test/', resourceNoSlash: undefined },
      { iri: 'http://localhost/test', resourceNoSlash: true }
    ].forEach(input => {
      it(`for IRI ${input.iri}, resourceNoSlash:${input.resourceNoSlash}`, async function () {
        await withServer(async server => {
          const endpoint = await createEndpoint()

          const handler = SparqlHandler({
            ...defaults,
            endpointUrl: endpoint.url,
            resourceNoSlash: input.resourceNoSlash
          })

          server.app.use(setIri(input.iri))
          server.app.use(handler)

          await server.fetch('/test')
          await endpoint.stop()

          strictEqual(endpoint.queries[0], `ASK { <${input.iri}> ?p ?o }`)
        })
      })
    })
  })

  describe('uses the resourceGraphQuery to query the full resource', async () => {
    [
      { iri: 'http://localhost/test', resourceNoSlash: undefined },
      { iri: 'http://localhost/test/', resourceNoSlash: undefined },
      { iri: 'http://localhost/test', resourceNoSlash: true }
    ].forEach(input => {
      it(`for IRI ${input.iri}, resourceNoSlash:${input.resourceNoSlash}`, async function () {
        await withServer(async server => {
          const endpoint = await createEndpoint()

          const handler = SparqlHandler({
            ...defaults,
            endpointUrl: endpoint.url,
            resourceNoSlash: input.resourceNoSlash
          })

          server.app.use(setIri(input.iri))
          server.app.use(handler)

          await server.fetch('/test')
          await endpoint.stop()

          strictEqual(endpoint.queries[1], `DESCRIBE <${input.iri}>`)
        })
      })
    })
  })

  describe('uses containerExistsQuery and containerGraphQuery', async () => {
    [
      { iri: 'http://localhost/test/', resourceNoSlash: true }
    ].forEach(input => {
      it(`for IRI ${input.iri}, resourceNoSlash:${input.resourceNoSlash}`, async function () {
        await withServer(async server => {
          const endpoint = await createEndpoint()

          const handler = SparqlHandler({
            ...defaults,
            endpointUrl: endpoint.url,
            resourceNoSlash: input.resourceNoSlash
          })

          server.app.use(setIri(input.iri))
          server.app.use(handler)

          await server.fetch('/test')
          await endpoint.stop()

          strictEqual(endpoint.queries[0], `ASK { ?s a ?o. FILTER REGEX(STR(?s), "^${input.iri}") }`)
          strictEqual(endpoint.queries[1], `CONSTRUCT { ?s a ?o. } WHERE { ?s a ?o. FILTER REGEX(STR(?s), "^${input.iri}") }`)
        })
      })
    })
  })

  it('should escape the IRI in resourceExistsQuery', async () => {
    await withServer(async server => {
      const endpoint = await createEndpoint()

      const handler = SparqlHandler({ ...defaults, endpointUrl: endpoint.url })

      server.app.use(setIri('http://localhost/test<test'))
      server.app.use(handler)

      await server.fetch('/test')
      await endpoint.stop()

      strictEqual(endpoint.queries[0], 'ASK { <http://localhost/test%3Ctest> ?p ?o }')
    })
  })

  it('should escape the IRI in resourceGraphQuery', async () => {
    await withServer(async server => {
      const endpoint = await createEndpoint()

      const handler = SparqlHandler({ ...defaults, endpointUrl: endpoint.url })

      server.app.use(setIri('http://localhost/test<test'))
      server.app.use(handler)

      await server.fetch('/test')
      await endpoint.stop()

      strictEqual(endpoint.queries[1], 'DESCRIBE <http://localhost/test%3Ctest>')
    })
  })

  it('should escape the IRI in containerExistsQuery', async () => {
    await withServer(async server => {
      const endpoint = await createEndpoint()

      const handler = SparqlHandler({ ...defaults, endpointUrl: endpoint.url, resourceNoSlash: true })

      server.app.use(setIri('http://localhost/test<test/'))
      server.app.use(handler)

      await server.fetch('/test')
      await endpoint.stop()

      strictEqual(endpoint.queries[0], 'ASK { ?s a ?o. FILTER REGEX(STR(?s), "^http://localhost/test%3Ctest/") }')
    })
  })

  it('should escape the IRI in containerGraphQuery', async () => {
    await withServer(async server => {
      const endpoint = await createEndpoint()

      const handler = SparqlHandler({ ...defaults, endpointUrl: endpoint.url, resourceNoSlash: true })

      server.app.use(setIri('http://localhost/test<test/'))
      server.app.use(handler)

      await server.fetch('/test')
      await endpoint.stop()

      strictEqual(endpoint.queries[1], 'CONSTRUCT { ?s a ?o. } WHERE { ?s a ?o. FILTER REGEX(STR(?s), "^http://localhost/test%3Ctest/") }')
    })
  })

  it('should add auth headers to request', async () => {
    await withServer(async server => {
      const endpoint = await createEndpoint()

      const authentication = {
        user: 'bob',
        password: 'password'
      }

      const handler = SparqlHandler({ ...defaults, endpointUrl: endpoint.url, authentication: authentication })

      server.app.use(setIri('http://localhost/test'))
      server.app.use(handler)

      await server.fetch('/test')
      await endpoint.stop()

      strictEqual(endpoint.requestHeaders[0].authorization, 'Basic Ym9iOnBhc3N3b3Jk')
    })
  })

  it('should use accept header', async () => {
    await withServer(async server => {
      const endpoint = await createEndpoint()

      const handler = SparqlHandler({ ...defaults, endpointUrl: endpoint.url })

      server.app.use(setIri('http://localhost/test'))
      server.app.use(handler)

      await server.fetch('/test', { headers: { accept: 'format' } })
      await endpoint.stop()

      strictEqual(endpoint.requestHeaders[1].accept, 'format')
    })
  })

  it('Returns a stream and clears content encoding', async () => {
    await withServer(async server => {
      const endpoint = await createEndpoint()

      const handler = SparqlHandler({ ...defaults, endpointUrl: endpoint.url })

      server.app.use(setIri('http://localhost/test'))
      server.app.use(handler)

      const res = await server.fetch('/test', { headers: { accept: 'format' } })
      await endpoint.stop()
      strictEqual(res.headers['content-encoding'], undefined)
    })
  })

  describe('Endpoint status codes forwarded', async () => {
    [
      400, 401, 403, 405, 415, 444,
      500, 501, 502, 503, 511
    ].forEach(status => {
      it(`for status ${status}`, async function () {
        await withServer(async server => {
          const endpoint = await createEndpoint(status)

          const handler = SparqlHandler({
            ...defaults,
            endpointUrl: endpoint.url
          })

          server.app.use(setIri('http://localhost/test'))
          server.app.use(handler)

          const res = await server.fetch('/test')
          await endpoint.stop()
          strictEqual(res.status, status)
        })
      })
    })
  })
})
