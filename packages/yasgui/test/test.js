import assert from 'assert'
import request from 'supertest'
import { describe, it } from 'mocha'
import trifidFactory from '../index.js'
import express from 'express'
import absoluteUrl from 'absolute-url'

const createTrifidConfig = (app, config) => {
  const server = app
  const logger = console
  const render = (filePath, context, options) => {
    return JSON.stringify({
      filePath,
      context,
      options
    }, null, 2)
  }

  return {
    config,
    server,
    logger,
    render
  }
}

describe('trifid-plugin-yasgui', () => {
  describe('trifid factory', () => {
    it('should be a factory', () => {
      assert.strictEqual(typeof trifidFactory, 'function')
    })

    it('should create a middleware with factory and default options', () => {
      const app = express()
      const trifid = createTrifidConfig(app, {})
      const middleware = trifidFactory(trifid)

      assert.strictEqual(typeof middleware, 'function')
    })
  })

  describe('middleware', () => {
    it('can execute', (done) => {
      const app = express()
      app.use(absoluteUrl())

      const trifidConfig = createTrifidConfig(app, {})
      const middleware = trifidFactory(trifidConfig)
      app.use('/sparql', middleware)

      request(app)
        .get('/sparql')
        .expect(200)
        .end(function (err, res) {
          if (err) done(err)
          done()
        })
    })
  })
})
