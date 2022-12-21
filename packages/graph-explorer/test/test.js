import assert from 'assert'
import withServer from 'express-as-promise/withServer.js'
import { describe, it } from 'mocha'
import trifidFactory from '../index.js'
// import getStream from 'get-stream'

const createTrifidConfig = (config, server = {}) => {
  const loggerSpy = []

  return {
    logger: (str) => loggerSpy.push(str),
    server,
    config
  }
}

describe('trifid-plugin-graph-explorer', () => {
  describe('trifid factory', () => {
    it('should be a factory', () => {
      assert.strictEqual(typeof trifidFactory, 'function')
    })

    it('should create a middleware with factory and default options', async () => {
      await withServer(async (server) => {
        const trifid = createTrifidConfig({}, server.app)
        trifidFactory(trifid)
      })
    })
  })

  // describe('middleware', () => {
  //   it('can execute', async () => {
  //     await withServer(async (server) => {
  //       const trifidConfig = createTrifidConfig({ endpointUrl: '/test' }, server.app)
  //       const middleware = trifidFactory(trifidConfig)
  //       server.app.use(middleware)

  //       const res = await server.fetch('/')
  //       const bodyStr = await getStream(res.body)
  //       assert.strictEqual(res.status, 200)
  //       assert.strictEqual(bodyStr.indexOf('GraphExplorer') > 0, true)
  //     })
  //   })
  // })
})
