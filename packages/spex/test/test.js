import assert from 'assert'
import { describe, it } from 'mocha'
import trifidFactory from '../index.js'
import request from 'supertest'
import express from 'express'

const createTrifidConfig = (config) => {
  return {
    config,
    render: async (_templatePath, _templateOptions, _layoutOptions) => {
      return 'OK'
    }
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
      const trifid = createTrifidConfig({
        endpointUrl: '/test'
      })
      const middleware = trifidFactory(trifid)

      const app = express()
      app.use('/spex', middleware)

      await request(app).get('/spex/').expect(200)
    })
  })
})
