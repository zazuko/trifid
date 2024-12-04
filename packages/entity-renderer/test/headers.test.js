// @ts-check

import { strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

import { getAcceptHeader } from '../lib/headers.js'

describe('lib/headers', () => {
  describe('getAcceptHeader', () => {
    it('should return the correct content type based on the query string (ttl)', () => {
      const req = {
        query: {
          format: 'ttl',
        },
        headers: {},
      }
      strictEqual(getAcceptHeader(req), 'text/turtle')
    })

    it('should return the correct content type based on the query string (jsonld)', () => {
      const req = {
        query: {
          format: 'jsonld',
        },
        headers: {},
      }
      strictEqual(getAcceptHeader(req), 'application/ld+json')
    })

    it('should return the correct content type based on the query string (xml)', () => {
      const req = {
        query: {
          format: 'xml',
        },
        headers: {},
      }
      strictEqual(getAcceptHeader(req), 'application/rdf+xml')
    })

    it('should return the correct content type based on the query string (nt)', () => {
      const req = {
        query: {
          format: 'nt',
        },
        headers: {},
      }
      strictEqual(getAcceptHeader(req), 'application/n-triples')
    })

    it('should return the correct content type based on the query string (trig)', () => {
      const req = {
        query: {
          format: 'trig',
        },
        headers: {},
      }
      strictEqual(getAcceptHeader(req), 'application/trig')
    })

    it('should return the correct content type based on the query string (csv)', () => {
      const req = {
        query: {
          format: 'csv',
        },
        headers: {},
      }
      strictEqual(getAcceptHeader(req), 'text/csv')
    })

    it('should return the correct content type based on the query string (html)', () => {
      const req = {
        query: {
          format: 'html',
        },
        headers: {},
      }
      strictEqual(getAcceptHeader(req), 'text/html')
    })

    it('should return the correct content type based on the accept header (ttl)', () => {
      const req = {
        query: {},
        headers: {
          accept: 'text/turtle',
        },
      }
      strictEqual(getAcceptHeader(req), 'text/turtle')
    })

    it('should return the correct content type based on the accept header (jsonld)', () => {
      const req = {
        query: {},
        headers: {
          accept: 'application/ld+json',
        },
      }
      strictEqual(getAcceptHeader(req), 'application/ld+json')
    })

    it('should return the correct content type based on the accept header (xml)', () => {
      const req = {
        query: {},
        headers: {
          accept: 'application/rdf+xml',
        },
      }
      strictEqual(getAcceptHeader(req), 'application/rdf+xml')
    })

    it('should return the correct content type based on the accept header (nt)', () => {
      const req = {
        query: {},
        headers: {
          accept: 'application/n-triples',
        },
      }
      strictEqual(getAcceptHeader(req), 'application/n-triples')
    })

    it('should return the correct content type based on the accept header (trig)', () => {
      const req = {
        query: {},
        headers: {
          accept: 'application/trig',
        },
      }
      strictEqual(getAcceptHeader(req), 'application/trig')
    })

    it('should return the correct content type based on the accept header (csv)', () => {
      const req = {
        query: {},
        headers: {
          accept: 'text/csv',
        },
      }
      strictEqual(getAcceptHeader(req), 'text/csv')
    })

    it('should return the correct content type based on the accept header (html)', () => {
      const req = {
        query: {},
        headers: {
          accept: 'text/html',
        },
      }
      strictEqual(getAcceptHeader(req), 'text/html')
    })

    it('should return the correct content type based on the accept header (html+jsonld)', () => {
      const req = {
        query: {},
        headers: {
          accept: 'text/html,application/ld+json',
        },
      }
      strictEqual(getAcceptHeader(req), 'text/html')
    })

    it('should return the correct content type based on the accept header (jsonld+ttl)', () => {
      const req = {
        query: {},
        headers: {
          accept: 'application/ld+json,text/turtle',
        },
      }
      strictEqual(getAcceptHeader(req), 'text/turtle')
    })

    it('should return the correct content type based on the accept header (plain+ttl)', () => {
      const req = {
        query: {},
        headers: {
          accept: 'text/plain,text/turtle',
        },
      }
      strictEqual(getAcceptHeader(req), 'text/turtle')
    })

    it('should return html by default', () => {
      const req = {
        query: {},
        headers: {},
      }
      strictEqual(getAcceptHeader(req), 'text/html')
    })
  })
})
