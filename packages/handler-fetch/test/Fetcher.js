/* global describe, it */

import assert from 'assert'
import fs from 'fs'
import nock from 'nock'
import rdf from 'rdf-ext'
import Fetcher from '../lib/Fetcher.js'

import { createRequire } from 'module'

const require = createRequire(import.meta.url)

describe('Fetcher', () => {
  const fileUrlDataset = `file://${require.resolve('tbbt-ld/dist/tbbt.nq')}`

  describe('.isCached', () => {
    it('should be a method', () => {
      assert.equal(typeof Fetcher.isCached, 'function')
    })

    it('should return false if caching is not enabled', () => {
      assert(!Fetcher.isCached({}))
    })

    it('should return false if caching is enabled but fetched date is not set', () => {
      assert(!Fetcher.isCached({ cache: true }))
    })

    it('should return true if caching is enabled and fetched date is set', () => {
      assert(Fetcher.isCached({
        cache: true,
        fetched: new Date()
      }))
    })
  })

  describe('.fetchDataset', () => {
    it('should be a method', () => {
      assert.equal(typeof Fetcher.fetchDataset, 'function')
    })

    it('should load a dataset from a file URL', async () => {
      const options = {
        url: fileUrlDataset,
        options: {
          contentTypeLookup: () => {
            return 'application/n-quads'
          }
        }
      }

      const dataset = await Fetcher.fetchDataset(options)
      const graphs = Array.from(dataset).reduce((graph, quad) => {
        graph[quad.graph.value] = true
        return graph
      }, {})
      assert(graphs['http://localhost:8080/data/person/amy-farrah-fowler'])
      assert(graphs['http://localhost:8080/data/person/sheldon-cooper'])
    })

    it('should load a dataset from a http URL', async () => {
      const content = fs.readFileSync(new URL(fileUrlDataset))

      nock('http://example.org').get('/dataset').reply(200, content, {
        'content-type': 'application/n-quads'
      })

      const options = {
        url: 'http://example.org/dataset'
      }

      const dataset = await Fetcher.fetchDataset(options)
      const graphs = Array.from(dataset).reduce((graph, quad) => {
        graph[quad.graph.value] = true
        return graph
      }, {})
      assert(graphs['http://localhost:8080/data/person/amy-farrah-fowler'])
      assert(graphs['http://localhost:8080/data/person/sheldon-cooper'])
    })

    it('should load a dataset from a http URL and use the given content type to parse it', async () => {
      const content = fs.readFileSync(new URL(fileUrlDataset))

      nock('http://example.org').get('/dataset-content-type').reply(200, content)

      const options = {
        url: 'http://example.org/dataset-content-type',
        contentType: 'application/n-quads'
      }

      const dataset = await Fetcher.fetchDataset(options)
      const graphs = Array.from(dataset).reduce((graph, quad) => {
        graph[quad.graph.value] = true
        return graph
      }, {})
      assert(graphs['http://localhost:8080/data/person/amy-farrah-fowler'])
      assert(graphs['http://localhost:8080/data/person/sheldon-cooper'])
    })
  })

  describe('.spreadDataset', () => {
    it('should be a method', () => {
      assert.equal(typeof Fetcher.spreadDataset, 'function')
    })

    it('should forward the dataset if no options are given', () => {
      const input = rdf.dataset([
        rdf.quad(
          rdf.namedNode('http://example.org/subject1'),
          rdf.namedNode('http://example.org/predicate'),
          rdf.literal('object'),
          rdf.namedNode('http://example.org/graph')),
        rdf.quad(
          rdf.namedNode('http://example.org/subject2'),
          rdf.namedNode('http://example.org/predicate'),
          rdf.literal('object'),
          rdf.namedNode('http://example.org/graph'))
      ])

      const output = rdf.dataset()

      Fetcher.spreadDataset(input, output, {})

      assert.equal(output.toCanonical(), input.toCanonical())
    })

    it('should load the triples into the given named node if resource is set', () => {
      const resource = 'http://example.org/resource'

      const input = rdf.dataset([
        rdf.quad(
          rdf.namedNode('http://example.org/subject1'),
          rdf.namedNode('http://example.org/predicate'),
          rdf.literal('object'),
          rdf.namedNode('http://example.org/graph')),
        rdf.quad(
          rdf.namedNode('http://example.org/subject2'),
          rdf.namedNode('http://example.org/predicate'),
          rdf.literal('object'),
          rdf.namedNode('http://example.org/graph'))
      ])

      const output = rdf.dataset()

      const expected = rdf.dataset([
        rdf.quad(
          rdf.namedNode('http://example.org/subject1'),
          rdf.namedNode('http://example.org/predicate'),
          rdf.literal('object'),
          rdf.namedNode(resource)),
        rdf.quad(
          rdf.namedNode('http://example.org/subject2'),
          rdf.namedNode('http://example.org/predicate'),
          rdf.literal('object'),
          rdf.namedNode(resource))
      ])

      Fetcher.spreadDataset(input, output, { resource })

      assert.equal(output.toCanonical(), expected.toCanonical())
    })

    it('should split the dataset if split option is true', () => {
      const input = rdf.dataset([
        rdf.quad(
          rdf.namedNode('http://example.org/subject1'),
          rdf.namedNode('http://example.org/predicate'),
          rdf.literal('object'),
          rdf.namedNode('http://example.org/graph')),
        rdf.quad(
          rdf.namedNode('http://example.org/subject2'),
          rdf.namedNode('http://example.org/predicate'),
          rdf.literal('object'),
          rdf.namedNode('http://example.org/graph'))
      ])

      const output = rdf.dataset()

      const expected = rdf.dataset([
        rdf.quad(
          rdf.namedNode('http://example.org/subject1'),
          rdf.namedNode('http://example.org/predicate'),
          rdf.literal('object'),
          rdf.namedNode('http://example.org/subject1')),
        rdf.quad(
          rdf.namedNode('http://example.org/subject2'),
          rdf.namedNode('http://example.org/predicate'),
          rdf.literal('object'),
          rdf.namedNode('http://example.org/subject2'))
      ])

      Fetcher.spreadDataset(input, output, { split: true })

      assert.equal(output.toCanonical(), expected.toCanonical())
    })

    it('should assign an array of all resources to the options object', () => {
      const input = rdf.dataset([
        rdf.quad(
          rdf.namedNode('http://example.org/subject1'),
          rdf.namedNode('http://example.org/predicate'),
          rdf.literal('object'),
          rdf.namedNode('http://example.org/graph1')),
        rdf.quad(
          rdf.namedNode('http://example.org/subject2'),
          rdf.namedNode('http://example.org/predicate'),
          rdf.literal('object'),
          rdf.namedNode('http://example.org/graph2'))
      ])

      const output = rdf.dataset()

      const options = {}

      Fetcher.spreadDataset(input, output, options)

      assert.deepEqual(options.resources, [
        'http://example.org/graph1',
        'http://example.org/graph2'
      ])
    })
  })
})
