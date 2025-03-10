// @ts-check

import { strictEqual, deepStrictEqual, throws, doesNotThrow } from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

import { checkSingleDatasetBaseUrl, checkDatasetBaseUrl } from '../lib/base.js'

describe('lib/base', () => {
  describe('checkSingleDatasetBaseUrl', () => {
    let logger
    let loggerValues

    beforeEach(() => {
      loggerValues = []
      logger = {
        warn: (/** @type {string} */ msg) => { loggerValues.push(msg) },
      }
    })

    afterEach(() => {
      logger = undefined
      loggerValues = undefined
    })

    it('should not throw on valid value', () => {
      strictEqual(checkSingleDatasetBaseUrl(logger, 'http://example.com/'), true)
    })

    it('should warn on missing trailing slash', () => {
      strictEqual(checkSingleDatasetBaseUrl(logger, 'http://example.com'), true)
      strictEqual(loggerValues.length, 1)
    })

    it('should throw on empty value', () => {
      throws(() => checkSingleDatasetBaseUrl(logger, ''))
    })

    it('should throw on non-string value', () => {
      // @ts-expect-error
      throws(() => checkSingleDatasetBaseUrl(logger, 42))
      // @ts-expect-error
      throws(() => checkSingleDatasetBaseUrl(logger, ['http://example.com/']))
    })
  })

  describe('checkDatasetBaseUrl', () => {
    let logger
    let loggerValues

    beforeEach(() => {
      loggerValues = []
      logger = {
        warn: (/** @type {string} */ msg) => { loggerValues.push(msg) },
      }
    })

    afterEach(() => {
      logger = undefined
      loggerValues = undefined
    })

    it('should not throw on valid value (string)', () => {
      deepStrictEqual(checkDatasetBaseUrl(logger, 'http://example.com/'), ['http://example.com/'])
    })

    it('should not throw on valid value (array)', () => {
      deepStrictEqual(checkDatasetBaseUrl(logger, ['http://example.com/']), ['http://example.com/'])
    })

    it('should warn on missing trailing slash', () => {
      deepStrictEqual(checkDatasetBaseUrl(logger, 'http://example.com'), ['http://example.com'])
      strictEqual(loggerValues.length, 1)
    })

    it('should throw on empty value', () => {
      doesNotThrow(() => checkDatasetBaseUrl(logger, ''))
    })

    it('should throw on array with an empty value', () => {
      throws(() => checkDatasetBaseUrl(logger, ['']))
    })

    it('should throw on array that contains an empty value somewhere', () => {
      throws(() => checkDatasetBaseUrl(logger, ['', 'http://example.com']))
      throws(() => checkDatasetBaseUrl(logger, ['http://example.com', '']))
    })

    it('should throw on array that contains a value that is not a string', () => {
      // @ts-expect-error
      throws(() => checkDatasetBaseUrl(logger, [42, 'http://example.com']))
      // @ts-expect-error
      throws(() => checkDatasetBaseUrl(logger, ['http://example.com', 42]))
    })
  })
})
