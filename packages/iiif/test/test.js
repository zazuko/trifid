import { strictEqual } from 'assert'
import { describe, it } from 'mocha'
import factory from '../index.js'

describe('trifid-handler-iiif', () => {
  it('should be a factory', () => {
    strictEqual(typeof factory, 'function')
  })
})
