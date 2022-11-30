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

    it('should create a middleware with factory and default options', async () => {
      const app = express()
      const trifid = createTrifidConfig(app, {})
      const middleware = await trifidFactory(trifid)

      assert.strictEqual(typeof middleware, 'function')
    })
  })

  describe('middleware', () => {
    it('can execute', (done) => {
      const app = express()
      app.use(absoluteUrl())

      const trifidConfig = createTrifidConfig(app, {})
      trifidFactory(trifidConfig).then(middleware => {
        app.use('/sparql', middleware)
        request(app)
          .get('/sparql')
          .expect(200)
          .end((err, _res) => {
            if (err) {
              done(err)
            } else {
              done()
            }
          })
      })
    })
  })

  describe('YASGUI dist', () => {
    it('can serve static CSS style', (done) => {
      const app = express()
      app.use(absoluteUrl())

      const trifidConfig = createTrifidConfig(app, {})
      trifidFactory(trifidConfig).then(middleware => {
        app.use('/sparql', middleware)
        request(app)
          .get('/yasgui-dist/yasgui.min.css')
          .expect(200)
          .end((err, _res) => {
            if (err) {
              done(err)
            } else {
              done()
            }
          })
      })
    })

    it('can serve static JavaScript script', (done) => {
      const app = express()
      app.use(absoluteUrl())

      const trifidConfig = createTrifidConfig(app, {})
      trifidFactory(trifidConfig).then(middleware => {
        app.use('/sparql', middleware)
        request(app)
          .get('/yasgui-dist/yasgui.min.js')
          .expect(200)
          .end((err, _res) => {
            if (err) {
              done(err)
            } else {
              done()
            }
          })
      })
    })
  })
})
