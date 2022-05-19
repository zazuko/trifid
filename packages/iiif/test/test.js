import assert from 'assert'
import withServer from 'express-as-promise/withServer.js'
import { describe, it } from 'mocha'
import trifidFactory from '../index.js'
import { createTrifidConfig } from './support/createTrifidConfig.js'

describe('trifid-plugin-iiif', () => {
  describe('trifid factory', () => {
    it('should be a factory', () => {
      assert.strictEqual(typeof trifidFactory, 'function')
    })

    it('should error if endpoint parameter is missing', () => {
      const trifid = createTrifidConfig({})
      assert.throws(() => trifidFactory(trifid), Error)
    })

    it('should create a middleware with factory and default options', () => {
      const trifid = createTrifidConfig({ endpointUrl: '/test' })
      const middleware = trifidFactory(trifid)

      assert.strictEqual(typeof middleware, 'function')
    })
  })

  describe('middleware', () => {
    it('warns about no uri parameter', async () => {
      await withServer(async server => {
        const loggerSpy = []
        const trifid = createTrifidConfig({ endpointUrl: '/test' }, loggerSpy)
        const middleware = trifidFactory(trifid)
        server.app.use(middleware)
        await server.fetch('/test')
        assert.strictEqual(loggerSpy[0], 'No uri query parameter')
      })
    })
  })
})
