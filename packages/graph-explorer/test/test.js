import assert from 'assert'
import withServer from 'express-as-promise/withServer.js'
import { describe, it } from 'mocha'
import trifidFactory from '../index.js'
import { renderFile } from 'ejs'

function createTrifidConfig (config, loggerSpy = []) {
  return {
    logger: str => loggerSpy.push(str),
    config: config
  }
}

describe('trifid-plugin-graph-explorer', () => {
  describe('trifid factory', () => {
    it('should be a factory', () => {
      assert.strictEqual(typeof trifidFactory, 'function')
    })

    it('should create a middleware with factory and default options', () => {
      const trifid = createTrifidConfig({})
      const middleware = trifidFactory(trifid)

      assert.strictEqual(typeof middleware, 'function')
    })
  })

  describe('middleware', () => {
    it('Mounts graph-explorer', async () => {
      await withServer(async server => {
        const trifidConfig = createTrifidConfig({ endpointUrl: '/test' })
        const middleware = trifidFactory(trifidConfig)
        server.app.engine('html', renderFile)
        server.app.use(middleware)

        const res = await server.fetch('/')
        assert.strictEqual(res.status, 200)
      })
    })
  })
})
