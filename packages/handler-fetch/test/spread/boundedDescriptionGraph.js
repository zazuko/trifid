/* global describe, it */

import assert from 'assert'
import rdf from 'rdf-ext'
import boundedDescriptionGraph from '../../lib/spread/boundedDescriptionGraph.js'

const ex = rdf.namespace('http://example.org/')

describe('resource', () => {
  it('should create sub graph for a resource', () => {
    const blankNode0 = rdf.blankNode()
    const blankNode1 = rdf.blankNode()

    const input = rdf.dataset([
      rdf.quad(ex.node0, ex.predicate, blankNode0),
      rdf.quad(blankNode0, ex.predicate, ex.node1),
      rdf.quad(ex.node1, ex.predicate, blankNode1),
    ])

    const output = boundedDescriptionGraph(input, ex.node0)

    const expected = rdf.dataset([
      rdf.quad(ex.node0, ex.predicate, blankNode0),
      rdf.quad(blankNode0, ex.predicate, ex.node1),
    ])

    assert.equal(output.toCanonical(), expected.toCanonical())
  })

  it('should handle circular links', () => {
    const blankNode = rdf.blankNode()

    const input = rdf.dataset([
      rdf.quad(ex.node, ex.predicate, blankNode),
      rdf.quad(blankNode, ex.predicate, ex.node),
    ])

    const output = boundedDescriptionGraph(input, ex.node)

    assert.equal(output.toCanonical(), input.toCanonical())
  })

  it('should ignore the fragment part of the subject', () => {
    const blankNode = rdf.blankNode()

    const input = rdf.dataset([
      rdf.quad(ex.node, ex.predicate, blankNode),
      rdf.quad(
        rdf.namedNode('http://example.org/node#fragment'),
        ex.predicate,
        blankNode,
      ),
    ])

    const output = boundedDescriptionGraph(input, ex.node)

    assert.equal(output.toCanonical(), input.toCanonical())
  })
})
