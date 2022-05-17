/* global describe, it */

import assert from 'assert'
import rdf from 'rdf-ext'
import splitIntoGraphs from '../../lib/spread/splitIntoGraphs.js'

const ex = rdf.namespace('http://example.org/')

describe('resourcesToGraph', () => {
  it('should split resources in separate graphs', () => {
    const namedNode0 = rdf.namedNode('http://example.org/node0')
    const namedNode1 = rdf.namedNode('http://example.org/node1')
    const blankNode0 = rdf.blankNode()
    const blankNode1 = rdf.blankNode()

    const input = rdf.dataset([
      rdf.quad(namedNode0, ex.predicate, blankNode0),
      rdf.quad(blankNode0, ex.predicate, namedNode1),
      rdf.quad(namedNode1, ex.predicate, blankNode1)
    ])

    const output = splitIntoGraphs(input)

    const expected = rdf.dataset([
      rdf.quad(namedNode0, ex.predicate, blankNode0, namedNode0),
      rdf.quad(blankNode0, ex.predicate, namedNode1, namedNode0),
      rdf.quad(namedNode1, ex.predicate, blankNode1, namedNode1)
    ])

    assert.equal(output.toCanonical(), expected.toCanonical())
  })

  it('should ignore the fragment part of the subject', () => {
    const namedNode0 = rdf.namedNode('http://example.org/node')
    const namedNode1 = rdf.namedNode('http://example.org/node#fragment')
    const blankNode0 = rdf.blankNode()
    const blankNode1 = rdf.blankNode()

    const input = rdf.dataset([
      rdf.quad(namedNode0, ex.predicate, blankNode0),
      rdf.quad(blankNode0, ex.predicate, namedNode1),
      rdf.quad(namedNode1, ex.predicate, blankNode1)
    ])

    const output = splitIntoGraphs(input)

    const expected = rdf.dataset([
      rdf.quad(namedNode0, ex.predicate, blankNode0, namedNode0),
      rdf.quad(blankNode0, ex.predicate, namedNode1, namedNode0),
      rdf.quad(namedNode1, ex.predicate, blankNode1, namedNode0)
    ])

    assert.equal(output.toCanonical(), expected.toCanonical())
  })
})
