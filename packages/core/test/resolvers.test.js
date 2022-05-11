import { describe, test, expect } from '@jest/globals'

import { cwdCallback, envCallback, envResolver } from '../lib/resolvers.js'

describe('resolvers', () => {
  // Environment variables resolver

  test('should be able to resolve an environment variable', () => {
    process.env.TEST_VARIABLE = 'test'
    expect(envCallback('TEST_VARIABLE')).toEqual('test')
    delete process.env.TEST_VARIABLE
  })

  test('should return an empty string on non-existant environment variables', () => {
    delete process.env.TEST_VARIABLE
    expect(envCallback('TEST_VARIABLE')).toEqual('')
  })

  test('env should not resolve to anything if it is another prefix', () => {
    expect(envResolver('something:TEST_VARIABLE')).toEqual('something:TEST_VARIABLE')
  })

  test('env should resolve with the right prefix', () => {
    process.env.TEST_VARIABLE = 'test'
    expect(envResolver('env:TEST_VARIABLE')).toEqual('test')
    delete process.env.TEST_VARIABLE
  })

  test('env should resolve to empty string for non-existant variable with the right prefix', () => {
    delete process.env.TEST_VARIABLE
    expect(envResolver('env:TEST_VARIABLE')).toEqual('')
  })

  // Current working directory resolver

  test('should return the current working directory', () => {
    expect(cwdCallback('.')).toEqual(process.cwd())
  })

  test('cwd should be able to resolve paths', () => {
    expect(cwdCallback('./test.js')).toEqual(`${process.cwd()}/test.js`)
    expect(cwdCallback('test.js')).toEqual(`${process.cwd()}/test.js`)
    expect(cwdCallback('././././test.js')).toEqual(`${process.cwd()}/test.js`)
    expect(cwdCallback('./a/.././test.js')).toEqual(`${process.cwd()}/test.js`)
    expect(cwdCallback('/test.js')).toEqual('/test.js')
    expect(cwdCallback('/a/b/c/test.js')).toEqual('/a/b/c/test.js')
  })
})
