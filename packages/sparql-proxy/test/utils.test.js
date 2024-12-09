import { describe, it } from 'node:test'
import { equal, deepEqual } from 'node:assert'

import { authBasicHeader, assertObject, objectLength, isValidUrl } from '../lib/utils.js'

describe('utils', () => {
  describe('authBasicHeader', () => {
    it('should return the expected value', () => {
      equal(authBasicHeader('user', 'password'), 'Basic dXNlcjpwYXNzd29yZA==')
    })
  })

  describe('assertObject', () => {
    it('should return false for null', () => {
      equal(assertObject(null), false)
    })

    it('should return false for a string', () => {
      equal(assertObject('string'), false)
    })

    it('should return false for a number', () => {
      equal(assertObject(42), false)
    })

    it('should return false for an array', () => {
      equal(assertObject([]), false)
    })

    it('should return false for a function', () => {
      equal(assertObject(() => { }), false)
    })

    it('should return false for a boolean', () => {
      equal(assertObject(true), false)
    })

    it('should return false for undefined', () => {
      equal(assertObject(undefined), false)
    })

    it('should return an object for an empty object', () => {
      deepEqual(assertObject({}), {})
    })

    it('should return an object for an object with properties', () => {
      deepEqual(assertObject({ foo: 'bar' }), { foo: 'bar' })
    })
  })

  describe('objectLength', () => {
    it('should return 0 for null', () => {
      equal(objectLength(null), 0)
    })

    it('should return 0 for a string', () => {
      equal(objectLength('string'), 0)
    })

    it('should return 0 for a number', () => {
      equal(objectLength(42), 0)
    })

    it('should return 0 for an array', () => {
      equal(objectLength([]), 0)
    })

    it('should return 0 for a function', () => {
      equal(objectLength(() => { }), 0)
    })

    it('should return 0 for a boolean', () => {
      equal(objectLength(true), 0)
    })

    it('should return 0 for undefined', () => {
      equal(objectLength(undefined), 0)
    })

    it('should return 0 for an empty object', () => {
      equal(objectLength({}), 0)
    })

    it('should return 1 for an object with one property', () => {
      equal(objectLength({ foo: 'bar' }), 1)
    })

    it('should return 2 for an object with two properties', () => {
      equal(objectLength({ one: '1', two: '2' }), 2)
    })

    it('should return 3 for an object with three properties', () => {
      equal(objectLength({ one: '1', two: '2', three: '2' }), 3)
    })
  })

  describe('isValidUrl', () => {
    it('should return true for a valid URL', () => {
      equal(isValidUrl('http://example.com/'), true)
    })

    it('should return false for an invalid URL', () => {
      equal(isValidUrl('not a URL'), false)
    })

    it('should return false for an empty string', () => {
      equal(isValidUrl(''), false)
    })

    it('should return false for undefined', () => {
      equal(isValidUrl(undefined), false)
    })

    it('should return false for null', () => {
      equal(isValidUrl(null), false)
    })

    it('should return false for a number', () => {
      equal(isValidUrl(42), false)
    })

    it('should return false for an object', () => {
      equal(isValidUrl({}), false)
    })

    it('should return false for an array', () => {
      equal(isValidUrl([]), false)
    })

    it('should return false for a boolean', () => {
      equal(isValidUrl(true), false)
    })

    it('should return false for a function', () => {
      equal(isValidUrl(() => { }), false)
    })
  })
})
