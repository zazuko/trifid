import { strictEqual, deepEqual } from 'node:assert'
import { describe, it } from 'mocha'
import { convertTermType, handleOxigraphResult } from '../lib/query.js'

describe('trifid-handler-fetch', () => {
  describe('check that required functions are defined', () => {
    it('fetch', () => {
      strictEqual(typeof fetch, 'function')
    })
  })

  describe('query', () => {
    it('should convert to the expected TermType', () => {
      strictEqual(convertTermType('Literal'), 'literal')
      strictEqual(convertTermType('BlankNode'), 'bnode')
      strictEqual(convertTermType('NamedNode'), 'uri')
      strictEqual(convertTermType(''), 'literal')
    })

    it('should handle ASK queries', async () => {
      const results = true
      const { raw, response, contentType, type } = await handleOxigraphResult(results)
      strictEqual(raw.boolean, results)
      strictEqual(response, JSON.stringify(raw, null, 2))
      strictEqual(contentType, 'application/sparql-results+json')
      strictEqual(type, 'ASK')
    })

    it('should handle empty results', async () => {
      const results = []
      const expectedResult = {
        head: {
          vars: [],
        },
        results: {
          bindings: [],
        },
      }
      const { raw, response, contentType, type } = await handleOxigraphResult(results)
      deepEqual(raw, expectedResult)
      strictEqual(response, JSON.stringify(expectedResult, null, 2))
      strictEqual(contentType, 'application/sparql-results+json')
      strictEqual(type, 'SELECT')
    })

    it('should handle CONSTRUCT queries', async () => {
      const results = []
      const { raw, response, contentType, type } = await handleOxigraphResult(results, true)
      strictEqual(raw, '')
      strictEqual(response, '')
      strictEqual(contentType, 'application/n-triples')
      strictEqual(type, 'CONSTRUCT')
    })

    it('should handle SELECT queries', async () => {
      const results = []
      const resultsMap = new Map()
      resultsMap.set('s', { termType: 'NamedNode', value: 'http://example.org/subject' })
      resultsMap.set('p', { termType: 'NamedNode', value: 'http://example.org/predicate' })
      resultsMap.set('o', { termType: 'Literal', value: 'object' })
      results.push(resultsMap)

      const expectedResult = {
        head: {
          vars: ['s', 'p', 'o'],
        },
        results: {
          bindings: [
            {
              s: {
                type: 'uri',
                value: 'http://example.org/subject',
              },
              p: {
                type: 'uri',
                value: 'http://example.org/predicate',
              },
              o: {
                type: 'literal',
                value: 'object',
              },
            },
          ],
        },
      }

      const { raw, response, contentType, type } = await handleOxigraphResult(results)
      deepEqual(raw, expectedResult)
      deepEqual(JSON.parse(response), expectedResult)
      strictEqual(contentType, 'application/sparql-results+json')
      strictEqual(type, 'SELECT')
    })

    it('should handle CONSTRUCT queries', async () => {
      const results = [
        { toString: () => '<http://example.org/subject1> <http://example.org/predicate1> "object1"' },
        { toString: () => '<http://example.org/subject2> <http://example.org/predicate2> "object2"' },
        { toString: () => '<http://example.org/subject3> <http://example.org/predicate3> "object3"' },
      ]

      const expectedRawResult = results.map((result) => result.toString())
      const expectedResult = `${expectedRawResult.join(' . \n')} .`

      const { raw, response, contentType, type } = await handleOxigraphResult(results, true)
      deepEqual(raw, expectedRawResult)
      deepEqual(response, expectedResult)
      strictEqual(contentType, 'application/n-triples')
      strictEqual(type, 'CONSTRUCT')
    })
  })
})
