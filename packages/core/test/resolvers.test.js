import { describe, test, expect } from '@jest/globals'

import { cwdCallback, cwdResolver, envCallback, envResolver, fileCallback } from '../lib/resolvers.js'

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

  test('cwd resolver should not resolve on other prefix', () => {
    expect(cwdResolver('something:test.js')).toEqual('something:test.js')
  })

  test('cwd resolver should resolve on the cwd prefix', () => {
    expect(cwdResolver('cwd:test.js')).toEqual(`${process.cwd()}/test.js`)
  })

  test('cwd resolver should give the same results than the callback', () => {
    expect(cwdResolver('cwd:.')).toEqual(process.cwd())
    expect(cwdResolver('cwd:./test.js')).toEqual(`${process.cwd()}/test.js`)
    expect(cwdResolver('cwd:test.js')).toEqual(`${process.cwd()}/test.js`)
    expect(cwdResolver('cwd:././././test.js')).toEqual(`${process.cwd()}/test.js`)
    expect(cwdResolver('cwd:./a/.././test.js')).toEqual(`${process.cwd()}/test.js`)
    expect(cwdResolver('cwd:/test.js')).toEqual('/test.js')
    expect(cwdResolver('cwd:/a/b/c/test.js')).toEqual('/a/b/c/test.js')
  })

  // File resolver

  test('file callback should behave the same as cwd if no base is defined', () => {
    expect(fileCallback()('.')).toEqual(process.cwd())
    expect(fileCallback()('./test.js')).toEqual(`${process.cwd()}/test.js`)
    expect(fileCallback()('test.js')).toEqual(`${process.cwd()}/test.js`)
    expect(fileCallback()('././././test.js')).toEqual(`${process.cwd()}/test.js`)
    expect(fileCallback()('./a/.././test.js')).toEqual(`${process.cwd()}/test.js`)
    expect(fileCallback()('/test.js')).toEqual('/test.js')
    expect(fileCallback()('/a/b/c/test.js')).toEqual('/a/b/c/test.js')

    // test with explicit 'undefined' base
    expect(fileCallback(undefined)('.')).toEqual(process.cwd())
    expect(fileCallback(undefined)('./test.js')).toEqual(`${process.cwd()}/test.js`)
    expect(fileCallback(undefined)('test.js')).toEqual(`${process.cwd()}/test.js`)
    expect(fileCallback(undefined)('././././test.js')).toEqual(`${process.cwd()}/test.js`)
    expect(fileCallback(undefined)('./a/.././test.js')).toEqual(`${process.cwd()}/test.js`)
    expect(fileCallback(undefined)('/test.js')).toEqual('/test.js')
    expect(fileCallback(undefined)('/a/b/c/test.js')).toEqual('/a/b/c/test.js')
  })

  test('file callback should resolve as expected with the specified base', () => {
    expect(fileCallback('/path/test')('.')).toEqual('/path/test')
    expect(fileCallback('/path/test')('..')).toEqual('/path')

    // note the '/' at the end
    expect(fileCallback('/path/test')('../')).toEqual('/path/')

    expect(fileCallback('/path/test')('../..')).toEqual('/')
    expect(fileCallback('/path/test')('../../')).toEqual('/')
    expect(fileCallback('/path/test')('../../..')).toEqual('/')
    expect(fileCallback('/path/test')('../../../')).toEqual('/')
    expect(fileCallback('/path/test')('./test.js')).toEqual('/path/test/test.js')
    expect(fileCallback('/path/test')('test.js')).toEqual('/path/test/test.js')
    expect(fileCallback('/path/test')('././././test.js')).toEqual('/path/test/test.js')
    expect(fileCallback('/path/test')('./a/.././test.js')).toEqual('/path/test/test.js')
    expect(fileCallback('/path/test')('/test.js')).toEqual('/test.js')
    expect(fileCallback('/path/test')('/a/b/c/test.js')).toEqual('/a/b/c/test.js')
  })
})
