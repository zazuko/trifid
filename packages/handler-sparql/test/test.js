import { strictEqual } from 'assert'
import withServer from 'express-as-promise/withServer.js'
import { describe, it } from 'mocha'
import SparqlHandler from '../index.js'
import createEndpoint from './support/createEndpoint.js'
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

  it('should use the resourceExistsQuery to check if the requested IRI exists', async () => {
    await withServer(async server => {
      const endpoint = await createEndpoint()

      const handler = new SparqlHandler({ ...defaults, endpointUrl: endpoint.url })

      server.app.use(setIri('http://localhost/test'))
      server.app.use(handler.handle.bind(handler))

      await server.fetch('/test')
      await endpoint.stop()

      strictEqual(endpoint.queries[0], 'ASK { <http://localhost/test> ?p ?o }')
    })
  })

  it('should use the resourceGraphQuery to query the full resource', async () => {
    await withServer(async server => {
      const endpoint = await createEndpoint()

      const handler = new SparqlHandler({ ...defaults, endpointUrl: endpoint.url })

      server.app.use(setIri('http://localhost/test'))
      server.app.use(handler.handle.bind(handler))

      await server.fetch('/test')
      await endpoint.stop()

      strictEqual(endpoint.queries[1], 'DESCRIBE <http://localhost/test>')
    })
  })

  it('should escape the IRI in resourceExistsQuery', async () => {
    await withServer(async server => {
      const endpoint = await createEndpoint()

      const handler = new SparqlHandler({ ...defaults, endpointUrl: endpoint.url })

      server.app.use(setIri('http://localhost/test<test'))
      server.app.use(handler.handle.bind(handler))

      await server.fetch('/test')
      await endpoint.stop()

      strictEqual(endpoint.queries[0], 'ASK { <http://localhost/test%3Ctest> ?p ?o }')
    })
  })

  it('should escape the IRI in resourceGraphQuery', async () => {
    await withServer(async server => {
      const endpoint = await createEndpoint()

      const handler = new SparqlHandler({ ...defaults, endpointUrl: endpoint.url })

      server.app.use(setIri('http://localhost/test<test'))
      server.app.use(handler.handle.bind(handler))

      await server.fetch('/test')
      await endpoint.stop()

      strictEqual(endpoint.queries[1], 'DESCRIBE <http://localhost/test%3Ctest>')
    })
  })
})
