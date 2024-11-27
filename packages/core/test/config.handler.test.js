// @ts-check

import { describe, it } from 'node:test'
import { equal, ok, doesNotThrow } from 'node:assert'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import handler from '../lib/config/handler.js'
import { fileCallback } from '../lib/resolvers.js'

/**
 * Assert that a promise is rejected.
 *
 * @param {Promise<any>} promise The promise to assert.
 * @returns {Promise<void>} A promise that resolves when the assertion is done.
 */
const assertRejection = (promise) => {
  return promise.then(
    () => {
      throw new Error('Expected promise to be rejected')
    },
    () => { },
  )
}

/**
 * Assert that a promise is resolved.
 *
 * @param {Promise<any>} promise The promise to assert.
 * @returns {Promise<void>} A promise that resolves when the assertion is done.
 */
const assertResolution = (promise) => {
  return promise.then(
    () => { },
    (error) => {
      throw new Error(`Expected promise to be resolved, but it was rejected with: ${error}`)
    },
  )
}

describe('config handler', () => {
  it('should not throw when loading an empty configuration file', () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    doesNotThrow(
      () => handler(fileCallback(currentDir)('./support/empty.json')),
    )
  })

  it('should not throw when loading an empty configuration', () => {
    return assertResolution(handler({}))
  })

  it('should not throw when loading a configuration that extends an existing one', () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    return assertResolution(
      handler({
        extends: [`${currentDir}/support/empty.json`],
      }),
    )
  })

  it('should throw when loading a configuration that extends a non-existant one', () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    return assertRejection(
      handler({
        extends: [`${currentDir}/support/non-existant.json`],
      }),
    )
  })

  it('should not throw when loading a basic configuration file', () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    return assertResolution(
      handler(fileCallback(currentDir)('./support/basic.json')),
    )
  })

  it('should not throw when loading a basic YAML configuration file', () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    return assertResolution(
      handler(fileCallback(currentDir)('./support/basic.yaml')),
    )
  })

  it('should throw when trying to load a non-existant configuration file', () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    return assertRejection(
      handler(fileCallback(currentDir)('./support/non-existant.json')),
    )
  })

  it('should throw when trying to read an invalid configuration file', () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    return assertRejection(
      handler(fileCallback(currentDir)('./support/invalid.json')),
    )
  })

  it('should throw when trying to read an invalid JSON file', () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    return assertRejection(
      handler(fileCallback(currentDir)('./support/invalid-json.json')),
    )
  })

  it('should support comments in JSON configuration file', () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    return assertResolution(
      handler(fileCallback(currentDir)('./support/basic-commented.json')),
    )
  })

  it('simple chain should work', () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    return assertResolution(
      handler(fileCallback(currentDir)('./support/chain/chain1.json')),
    )
  })

  it('check if expected values are here on extended config', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    const config = await handler(
      fileCallback(currentDir)('./support/chain/chain1.json'),
    )

    ok(config.globals !== undefined)
    ok(config.globals.value3 !== undefined)
    equal(config.globals.value3, 'chain3')
    ok(config.globals.value2 !== undefined)
    equal(config.globals.value2, 'chain2')
    ok(config.globals.value1 !== undefined)
    equal(config.globals.value1, 'chain1')
    ok(config.globals.value !== undefined)
    equal(config.globals.value, 'chain1')
  })

  it('simple check using the file resolver should work', () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    return assertResolution(
      handler(fileCallback(currentDir)('./support/chain-file/chain1.json')),
    )
  })

  it('check if expected values are here on extended config with file prefix', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    const config = await handler(
      fileCallback(currentDir)('./support/chain-file/chain1.json'),
    )

    ok(config.globals !== undefined)
    ok(config.globals.value3 !== undefined)
    equal(config.globals.value3, 'chain3')
    ok(config.globals.value2 !== undefined)
    equal(config.globals.value2, 'chain2')
    ok(config.globals.value1 !== undefined)
    equal(config.globals.value1, 'chain1')
    ok(config.globals.value !== undefined)
    equal(config.globals.value, 'chain1')
  })

  it('should throw in case of infinite loop', () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    return assertRejection(
      handler(fileCallback(currentDir)('./support/infinite-loop/chain1.json')),
    )
  })
})
