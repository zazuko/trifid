import assert from 'assert'
import rdfHttpHandler from '../index.js'

describe('rdf-handler-http', () => {
  it('should be a function', () => {
    assert.strictEqual(typeof rdfHttpHandler, 'function')
  })
})
