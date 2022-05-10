/* global describe, it */

import assert from 'assert'
import path, { dirname } from 'path'
import Trifid from '../index.js'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('Trifid', () => {
  it('should be a constructor', () => {
    assert.equal(typeof Trifid, 'function')
  })

  it('should have a configHandler', () => {
    const trifid = new Trifid()

    assert.equal(typeof trifid.configHandler, 'object')
  })

  it('should register a resolver for cwd', () => {
    const trifid = new Trifid()

    return trifid.configHandler.resolve('cwd:test').then(resolved => {
      assert.notEqual(resolved, 'cwd:test')
    })
  })

  it(
    'should register a resolver for cwd which uses the cwd as base path',
    () => {
      const trifid = new Trifid()

      return trifid.configHandler.resolve('cwd:test').then(resolved => {
        assert.equal(resolved, path.join(process.cwd(), 'test'))
      })
    }
  )

  it('should register a resolver for env', () => {
    const trifid = new Trifid()

    return trifid.configHandler.resolve('env:test').then(resolved => {
      assert.notEqual(resolved, 'env:test')
    })
  })

  it(
    'should register a resolver for env which resolves based on environment variables',
    () => {
      const trifid = new Trifid()

      process.env.test = 'tmp'

      return trifid.configHandler.resolve('env:test').then(resolved => {
        assert.equal(resolved, 'tmp')
      })
    }
  )

  it(
    'should register a resolver for env which returns an empty string if the environment variable is not set',
    () => {
      const trifid = new Trifid()

      if (process.env.test) {
        delete process.env.test
      }

      return trifid.configHandler.resolve('env:test').then(resolved => {
        assert.equal(resolved, '')
      })
    }
  )

  it('should register a resolver for trifid-core', () => {
    const trifid = new Trifid()

    return trifid.configHandler.resolve('trifid-core:test').then(resolved => {
      assert.notEqual(resolved, 'trifid-core:test')
    })
  })

  it(
    'should register a resolver for trifid-core which uses the trifid-core root as base path',
    () => {
      const trifid = new Trifid()

      return trifid.configHandler.resolve('trifid-core:test').then(resolved => {
        assert.equal(resolved, path.join(__dirname, '../test'))
      })
    }
  )
})
