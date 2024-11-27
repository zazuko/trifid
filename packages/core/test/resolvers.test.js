// @ts-check

import { describe, it } from 'node:test'
import { equal } from 'node:assert'

import {
  cwdCallback,
  cwdResolver,
  envCallback,
  envResolver,
  fileCallback,
  fileResolver,
} from '../lib/resolvers.js'

describe('resolvers', () => {
  // Environment variables resolver

  it('should be able to resolve an environment variable', () => {
    process.env.TEST_VARIABLE = 'test'
    equal(envCallback('TEST_VARIABLE'), 'test')
    delete process.env.TEST_VARIABLE
  })

  it('should return an empty string on non-existant environment variables', () => {
    delete process.env.TEST_VARIABLE
    equal(envCallback('TEST_VARIABLE'), '')
  })

  it('env should not resolve to anything if it is another prefix', () => {
    equal(
      envResolver('something:TEST_VARIABLE'),
      'something:TEST_VARIABLE',
    )
  })

  it('env should resolve with the right prefix', () => {
    process.env.TEST_VARIABLE = 'test'
    equal(envResolver('env:TEST_VARIABLE'), 'test')
    delete process.env.TEST_VARIABLE
  })

  it('env should resolve to empty string for non-existant variable with the right prefix', () => {
    delete process.env.TEST_VARIABLE
    equal(envResolver('env:TEST_VARIABLE'), '')
  })

  // Current working directory resolver

  it('should return the current working directory', () => {
    equal(cwdCallback('.'), process.cwd())
  })

  it('cwd should be able to resolve paths', () => {
    equal(cwdCallback('./test.js'), `${process.cwd()}/test.js`)
    equal(cwdCallback('test.js'), `${process.cwd()}/test.js`)
    equal(cwdCallback('././././test.js'), `${process.cwd()}/test.js`)
    equal(cwdCallback('./a/.././test.js'), `${process.cwd()}/test.js`)
    equal(cwdCallback('/test.js'), '/test.js')
    equal(cwdCallback('/a/b/c/test.js'), '/a/b/c/test.js')
  })

  it('cwd resolver should not resolve on other prefix', () => {
    equal(cwdResolver('something:test.js'), 'something:test.js')
  })

  it('cwd resolver should resolve on the cwd prefix', () => {
    equal(cwdResolver('cwd:test.js'), `${process.cwd()}/test.js`)
  })

  it('cwd resolver should give the same results than the callback', () => {
    equal(cwdResolver('cwd:.'), process.cwd())
    equal(cwdResolver('cwd:./test.js'), `${process.cwd()}/test.js`)
    equal(cwdResolver('cwd:test.js'), `${process.cwd()}/test.js`)
    equal(
      cwdResolver('cwd:././././test.js'),
      `${process.cwd()}/test.js`,
    )
    equal(
      cwdResolver('cwd:./a/.././test.js'),
      `${process.cwd()}/test.js`,
    )
    equal(cwdResolver('cwd:/test.js'), '/test.js')
    equal(cwdResolver('cwd:/a/b/c/test.js'), '/a/b/c/test.js')
  })

  // File resolver

  it('file callback should behave the same as cwd if no base is defined', () => {
    equal(fileCallback()('.'), process.cwd())
    equal(fileCallback()('./test.js'), `${process.cwd()}/test.js`)
    equal(fileCallback()('test.js'), `${process.cwd()}/test.js`)
    equal(
      fileCallback()('././././test.js'),
      `${process.cwd()}/test.js`,
    )
    equal(
      fileCallback()('./a/.././test.js'),
      `${process.cwd()}/test.js`,
    )
    equal(fileCallback()('/test.js'), '/test.js')
    equal(fileCallback()('/a/b/c/test.js'), '/a/b/c/test.js')

    // test with explicit 'undefined' base
    equal(fileCallback(undefined)('.'), process.cwd())
    equal(
      fileCallback(undefined)('./test.js'),
      `${process.cwd()}/test.js`,
    )
    equal(
      fileCallback(undefined)('test.js'),
      `${process.cwd()}/test.js`,
    )
    equal(
      fileCallback(undefined)('././././test.js'),
      `${process.cwd()}/test.js`,
    )
    equal(
      fileCallback(undefined)('./a/.././test.js'),
      `${process.cwd()}/test.js`,
    )
    equal(fileCallback(undefined)('/test.js'), '/test.js')
    equal(fileCallback(undefined)('/a/b/c/test.js'), '/a/b/c/test.js')
  })

  it('file callback should resolve as expected with the specified base', () => {
    equal(fileCallback('/path/test')('.'), '/path/test')
    equal(fileCallback('/path/test')('..'), '/path')

    // note the '/' at the end
    equal(fileCallback('/path/test')('../'), '/path/')

    equal(fileCallback('/path/test')('../..'), '/')
    equal(fileCallback('/path/test')('../../'), '/')
    equal(fileCallback('/path/test')('../../..'), '/')
    equal(fileCallback('/path/test')('../../../'), '/')
    equal(
      fileCallback('/path/test')('./test.js'),
      '/path/test/test.js',
    )
    equal(fileCallback('/path/test')('test.js'), '/path/test/test.js')
    equal(
      fileCallback('/path/test')('././././test.js'),
      '/path/test/test.js',
    )
    equal(
      fileCallback('/path/test')('./a/.././test.js'),
      '/path/test/test.js',
    )
    equal(fileCallback('/path/test')('/test.js'), '/test.js')
    equal(
      fileCallback('/path/test')('/a/b/c/test.js'),
      '/a/b/c/test.js',
    )
  })

  it('file resolver should not resolve on other prefix', () => {
    equal(fileResolver('something:test.js'), 'something:test.js')
  })

  it('file resolver should resolve on the file prefix', () => {
    equal(fileResolver('file:test.js'), `${process.cwd()}/test.js`)
    equal(
      fileResolver('file:test.js', undefined),
      `${process.cwd()}/test.js`,
    )
    equal(
      fileResolver('file:test.js', '/path/test'),
      '/path/test/test.js',
    )
  })

  it('file resolver should behave the same as the file callback', () => {
    equal(fileResolver('file:.', '/path/test'), '/path/test')
    equal(fileResolver('file:..', '/path/test'), '/path')

    // note the '/' at the end
    equal(fileResolver('file:../', '/path/test'), '/path/')

    equal(fileResolver('file:../..', '/path/test'), '/')
    equal(fileResolver('file:../../', '/path/test'), '/')
    equal(fileResolver('file:../../..', '/path/test'), '/')
    equal(fileResolver('file:../../../', '/path/test'), '/')
    equal(
      fileResolver('file:./test.js', '/path/test'),
      '/path/test/test.js',
    )
    equal(
      fileResolver('file:test.js', '/path/test'),
      '/path/test/test.js',
    )
    equal(
      fileResolver('file:././././test.js', '/path/test'),
      '/path/test/test.js',
    )
    equal(
      fileResolver('file:./a/.././test.js', '/path/test'),
      '/path/test/test.js',
    )
    equal(fileResolver('file:/test.js', '/path/test'), '/test.js')
    equal(
      fileResolver('file:/a/b/c/test.js', '/path/test'),
      '/a/b/c/test.js',
    )
  })
})
