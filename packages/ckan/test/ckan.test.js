import assert from 'assert'
import withServer from 'express-as-promise/withServer.js'
import { describe, it } from 'mocha'
import trifidFactory from '../src/index.js'

const createTrifidConfig = (config, server = {}) => {
  const loggerSpy = []

  return {
    logger: (str) => loggerSpy.push(str),
    server,
    config,
  }
}

describe('@zazuko/trifid-plugin-ckan', () => {
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
})
