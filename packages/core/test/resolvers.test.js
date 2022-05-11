import { describe, it, expect } from '@jest/globals'

import { envCallback } from '../lib/resolvers.js'

describe('resolvers', () => {
  it('should be able to resolve an environment variable', () => {
    delete process.env.TEST_VARIABLE
    process.env.TEST_VARIABLE = 'test'
    expect(envCallback('TEST_VARIABLE')).toEqual('test')
    delete process.env.TEST_VARIABLE
  })

  it('should return an empty string on non-existant environment variables', () => {
    delete process.env.TEST_VARIABLE
    expect(envCallback('TEST_VARIABLE')).toEqual('')
  })
})
