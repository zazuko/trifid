// @ts-check

import { describe, it } from 'mocha'
import { expect } from 'chai'

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
    expect(envCallback('TEST_VARIABLE')).to.equal('test')
    delete process.env.TEST_VARIABLE
  })

  it('should return an empty string on non-existant environment variables', () => {
    delete process.env.TEST_VARIABLE
    expect(envCallback('TEST_VARIABLE')).to.equal('')
  })

  it('env should not resolve to anything if it is another prefix', () => {
    expect(envResolver('something:TEST_VARIABLE')).to.equal(
      'something:TEST_VARIABLE',
    )
  })

  it('env should resolve with the right prefix', () => {
    process.env.TEST_VARIABLE = 'test'
    expect(envResolver('env:TEST_VARIABLE')).to.equal('test')
    delete process.env.TEST_VARIABLE
  })

  it('env should resolve to empty string for non-existant variable with the right prefix', () => {
    delete process.env.TEST_VARIABLE
    expect(envResolver('env:TEST_VARIABLE')).to.equal('')
  })

  // Current working directory resolver

  it('should return the current working directory', () => {
    expect(cwdCallback('.')).to.equal(process.cwd())
  })

  it('cwd should be able to resolve paths', () => {
    expect(cwdCallback('./test.js')).to.equal(`${process.cwd()}/test.js`)
    expect(cwdCallback('test.js')).to.equal(`${process.cwd()}/test.js`)
    expect(cwdCallback('././././test.js')).to.equal(`${process.cwd()}/test.js`)
    expect(cwdCallback('./a/.././test.js')).to.equal(`${process.cwd()}/test.js`)
    expect(cwdCallback('/test.js')).to.equal('/test.js')
    expect(cwdCallback('/a/b/c/test.js')).to.equal('/a/b/c/test.js')
  })

  it('cwd resolver should not resolve on other prefix', () => {
    expect(cwdResolver('something:test.js')).to.equal('something:test.js')
  })

  it('cwd resolver should resolve on the cwd prefix', () => {
    expect(cwdResolver('cwd:test.js')).to.equal(`${process.cwd()}/test.js`)
  })

  it('cwd resolver should give the same results than the callback', () => {
    expect(cwdResolver('cwd:.')).to.equal(process.cwd())
    expect(cwdResolver('cwd:./test.js')).to.equal(`${process.cwd()}/test.js`)
    expect(cwdResolver('cwd:test.js')).to.equal(`${process.cwd()}/test.js`)
    expect(cwdResolver('cwd:././././test.js')).to.equal(
      `${process.cwd()}/test.js`,
    )
    expect(cwdResolver('cwd:./a/.././test.js')).to.equal(
      `${process.cwd()}/test.js`,
    )
    expect(cwdResolver('cwd:/test.js')).to.equal('/test.js')
    expect(cwdResolver('cwd:/a/b/c/test.js')).to.equal('/a/b/c/test.js')
  })

  // File resolver

  it('file callback should behave the same as cwd if no base is defined', () => {
    expect(fileCallback()('.')).to.equal(process.cwd())
    expect(fileCallback()('./test.js')).to.equal(`${process.cwd()}/test.js`)
    expect(fileCallback()('test.js')).to.equal(`${process.cwd()}/test.js`)
    expect(fileCallback()('././././test.js')).to.equal(
      `${process.cwd()}/test.js`,
    )
    expect(fileCallback()('./a/.././test.js')).to.equal(
      `${process.cwd()}/test.js`,
    )
    expect(fileCallback()('/test.js')).to.equal('/test.js')
    expect(fileCallback()('/a/b/c/test.js')).to.equal('/a/b/c/test.js')

    // test with explicit 'undefined' base
    expect(fileCallback(undefined)('.')).to.equal(process.cwd())
    expect(fileCallback(undefined)('./test.js')).to.equal(
      `${process.cwd()}/test.js`,
    )
    expect(fileCallback(undefined)('test.js')).to.equal(
      `${process.cwd()}/test.js`,
    )
    expect(fileCallback(undefined)('././././test.js')).to.equal(
      `${process.cwd()}/test.js`,
    )
    expect(fileCallback(undefined)('./a/.././test.js')).to.equal(
      `${process.cwd()}/test.js`,
    )
    expect(fileCallback(undefined)('/test.js')).to.equal('/test.js')
    expect(fileCallback(undefined)('/a/b/c/test.js')).to.equal('/a/b/c/test.js')
  })

  it('file callback should resolve as expected with the specified base', () => {
    expect(fileCallback('/path/test')('.')).to.equal('/path/test')
    expect(fileCallback('/path/test')('..')).to.equal('/path')

    // note the '/' at the end
    expect(fileCallback('/path/test')('../')).to.equal('/path/')

    expect(fileCallback('/path/test')('../..')).to.equal('/')
    expect(fileCallback('/path/test')('../../')).to.equal('/')
    expect(fileCallback('/path/test')('../../..')).to.equal('/')
    expect(fileCallback('/path/test')('../../../')).to.equal('/')
    expect(fileCallback('/path/test')('./test.js')).to.equal(
      '/path/test/test.js',
    )
    expect(fileCallback('/path/test')('test.js')).to.equal('/path/test/test.js')
    expect(fileCallback('/path/test')('././././test.js')).to.equal(
      '/path/test/test.js',
    )
    expect(fileCallback('/path/test')('./a/.././test.js')).to.equal(
      '/path/test/test.js',
    )
    expect(fileCallback('/path/test')('/test.js')).to.equal('/test.js')
    expect(fileCallback('/path/test')('/a/b/c/test.js')).to.equal(
      '/a/b/c/test.js',
    )
  })

  it('file resolver should not resolve on other prefix', () => {
    expect(fileResolver('something:test.js')).to.equal('something:test.js')
  })

  it('file resolver should resolve on the file prefix', () => {
    expect(fileResolver('file:test.js')).to.equal(`${process.cwd()}/test.js`)
    expect(fileResolver('file:test.js', undefined)).to.equal(
      `${process.cwd()}/test.js`,
    )
    expect(fileResolver('file:test.js', '/path/test')).to.equal(
      '/path/test/test.js',
    )
  })

  it('file resolver should behave the same as the file callback', () => {
    expect(fileResolver('file:.', '/path/test')).to.equal('/path/test')
    expect(fileResolver('file:..', '/path/test')).to.equal('/path')

    // note the '/' at the end
    expect(fileResolver('file:../', '/path/test')).to.equal('/path/')

    expect(fileResolver('file:../..', '/path/test')).to.equal('/')
    expect(fileResolver('file:../../', '/path/test')).to.equal('/')
    expect(fileResolver('file:../../..', '/path/test')).to.equal('/')
    expect(fileResolver('file:../../../', '/path/test')).to.equal('/')
    expect(fileResolver('file:./test.js', '/path/test')).to.equal(
      '/path/test/test.js',
    )
    expect(fileResolver('file:test.js', '/path/test')).to.equal(
      '/path/test/test.js',
    )
    expect(fileResolver('file:././././test.js', '/path/test')).to.equal(
      '/path/test/test.js',
    )
    expect(fileResolver('file:./a/.././test.js', '/path/test')).to.equal(
      '/path/test/test.js',
    )
    expect(fileResolver('file:/test.js', '/path/test')).to.equal('/test.js')
    expect(fileResolver('file:/a/b/c/test.js', '/path/test')).to.equal(
      '/a/b/c/test.js',
    )
  })
})
