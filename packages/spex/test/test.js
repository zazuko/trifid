import assert from 'assert'
import withServer from 'express-as-promise/withServer.js'
import { describe, it } from 'mocha'
import trifidFactory from '../index.js'
import { renderFile } from 'ejs'
import getStream from 'get-stream'

function createTrifidConfig (config, loggerSpy = []) {
  return {
    logger: str => loggerSpy.push(str),
    config
  }
}

describe('trifid-plugin-spex', () => {
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
    it('can execute', async () => {
      await withServer(async server => {
        const logs = []
        const trifidConfig = createTrifidConfig({ endpointUrl: '/test' }, logs)
        const middleware = trifidFactory(trifidConfig)
        server.app.engine('html', renderFile)
        server.app.use(middleware)

        const res = await server.fetch('/')
        const bodyStr = await getStream(res.body)
        assert.strictEqual(res.status, 200)
        assert.strictEqual(bodyStr.indexOf('<div id="spex">') > 0, true)
      })
    })
  })
})
