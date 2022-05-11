import { describe, test, expect } from '@jest/globals'

import { envCallback, envResolver } from '../lib/resolvers.js'

describe('resolvers', () => {
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
})
