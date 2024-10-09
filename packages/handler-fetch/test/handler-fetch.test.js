// @ts-check

import { strictEqual, notStrictEqual } from 'node:assert'
import { describe, it, before } from 'node:test'
import oxigraph from 'oxigraph'
import { performOxigraphQuery } from '../lib/query.js'

describe('trifid-handler-fetch', () => {
  let store

  before(async () => {
    store = new oxigraph.Store()

    // @ts-ignore
    store.load(`@prefix ex: <http://example.org/> .
    @prefix foaf: <http://xmlns.com/foaf/0.1/> .

    ex:person1 a foaf:Person ;
      foaf:name "John Doe" ;
      foaf:mbox <mailto:john.doe@example.org> ;
      ex:age 30 ;
      ex:worksAt ex:company1 .

    ex:person2 a foaf:Person ;
      foaf:name "Jane Smith" ;
      foaf:mbox <mailto:jane.smith@example.org> ;
      ex:age 28 ;
      ex:worksAt ex:company2 .

    ex:company1 a ex:Company ;
      ex:companyName "Tech Solutions" ;
      ex:location "San Francisco" .

    ex:company2 a ex:Company ;
      ex:companyName "Innovate Ltd." ;
      ex:location "New York" .
    `, {
      format: 'text/turtle',
      base_iri: 'http://example.org/',
      to_graph_name: oxigraph.defaultGraph(),
    })
  })

  describe('check that required functions are defined', () => {
    it('fetch', () => {
      strictEqual(typeof fetch, 'function')
    })
  })

  describe('ASK queries', () => {
    it('simple', async () => {
      const query = 'ASK { ?s ?p ?o }'
      const { response, contentType } = await performOxigraphQuery(store, query)
      strictEqual(contentType, 'application/sparql-results+json')
      const parsedResponse = JSON.parse(response)
      strictEqual(parsedResponse.boolean, true)
    })

    it('specific', async () => {
      const query = 'ASK { <http://example.org/person1> ?p ?o }'
      const { response, contentType } = await performOxigraphQuery(store, query)
      strictEqual(contentType, 'application/sparql-results+json')
      const parsedResponse = JSON.parse(response)
      strictEqual(parsedResponse.boolean, true)
    })

    it('non-existant', async () => {
      const query = 'ASK { <http://example.org/person_missing> ?p ?o }'
      const { response, contentType } = await performOxigraphQuery(store, query)
      strictEqual(contentType, 'application/sparql-results+json')
      const parsedResponse = JSON.parse(response)
      strictEqual(parsedResponse.boolean, false)
    })
  })

  describe('SELECT queries', () => {
    it('simple', async () => {
      const query = 'SELECT * WHERE { <http://example.org/person1> ?p ?o }'
      const { response, contentType } = await performOxigraphQuery(store, query)
      strictEqual(contentType, 'application/sparql-results+json')
      const parsedResponse = JSON.parse(response)
      strictEqual(parsedResponse.head.vars.length, 2)
      strictEqual(parsedResponse.results.bindings.length, 5)
    })
  })

  describe('DESCRIBE queries', () => {
    it('simple', async () => {
      const query = 'DESCRIBE <http://example.org/person1>'
      const { contentType } = await performOxigraphQuery(store, query)
      notStrictEqual(contentType, 'application/sparql-results+json')
    })
  })

  describe('CONSTRUCT queries', () => {
    it('simple', async () => {
      const query = 'CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o } LIMIT 10'
      const { contentType } = await performOxigraphQuery(store, query)
      notStrictEqual(contentType, 'application/sparql-results+json')
    })
  })

  describe('Invalid queries', () => {
    it('simple', async () => {
      const query = 'INVALID_KEYWORD { ?s ?p ?o } WHERE { ?s ?p ?o }'
      const { contentType } = await performOxigraphQuery(store, query)
      strictEqual(contentType, 'text/plain')
    })
  })
})
