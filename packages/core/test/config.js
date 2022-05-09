/* global describe, it */

import assert from 'assert'
import schema from '../lib/config/schema.js'
import parser from '../lib/config/parser.js'

describe('config', () => {
  it('should be an object', () => {
    assert.equal(typeof schema, 'object')
  })

  it('should not throw if the configuration is empty', () => {
    assert.doesNotThrow(() => {
      parser()
    })

    assert.doesNotThrow(() => {
      parser({})
    })
  })

  it('should not throw on valid values for extends', () => {
    assert.doesNotThrow(() => {
      parser({
        extends: []
      })
    })

    assert.doesNotThrow(() => {
      parser({
        extends: [
          'path'
        ]
      })
    })

    assert.doesNotThrow(() => {
      parser({
        extends: [
          'path1',
          'path2',
          'path3'
        ]
      })
    })
  })

  it('should throw on invalid values for extends', () => {
    // this is a string instead of an array of strings
    assert.throws(() => {
      parser({
        extends: 'this is a string instead of an array'
      })
    })

    // this is not an array of strings, but an array of integers
    assert.throws(() => {
      parser({
        extends: [1, 2, 3]
      })
    })
  })
})
