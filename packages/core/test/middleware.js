/* global describe, it */

const assert = require('assert')
const express = require('express')
const request = require('supertest')
const middleware = require('../lib/middleware')

describe('middleware', () => {
  describe('.mount', () => {
    it('should be a function', () => {
      assert.equal(typeof middleware.mount, 'function')
    })

    it('should mount the middleware returned by the callback', () => {
      let touched = false

      const app = express()

      middleware.mount(app, {}, () => {
        return (req, res, next) => {
          touched = true

          next()
        }
      })

      return request(app)
        .get('/')
        .then(() => {
          assert(touched)
        })
    })

    it('should mount the middleware under the patch defined in config', () => {
      let touched = false

      const app = express()

      middleware.mount(app, { path: '/a' }, () => {
        return (req, res, next) => {
          touched = true

          next()
        }
      })

      return request(app)
        .get('/a')
        .then(() => {
          assert(touched)
        })
    })

    it('should mount the middleware for the given hostname', () => {
      let count = 0

      const app = express()

      middleware.mount(app, { hostname: 'example.org' }, () => {
        return (req, res, next) => {
          count++

          next()
        }
      })

      return Promise.all([
        request(app)
          .get('/')
          .set('host', 'example.org'),
        request(app)
          .get('/')
          .set('host', 'example.com')
      ]).then(() => {
        assert.equal(count, 1)
      })
    })
  })

  describe('.mountAll', () => {
    it('should be a function', () => {
      assert.equal(typeof middleware.mountAll, 'function')
    })

    it('should mount each config entry', () => {
      let count = 0

      const app = express()

      const configs = {
        a: {},
        b: {}
      }

      middleware.mountAll(app, configs, () => {
        return (req, res, next) => {
          count++

          next()
        }
      })

      return request(app)
        .get('/a')
        .then(() => {
          assert.equal(count, 2)
        })
    })

    it('should mount each config entry by priority', async () => {
      const order = []

      const app = express()

      const configs = {
        a: { priority: 20 },
        b: { priority: 30 },
        c: { priority: 10 }
      }

      await middleware.mountAll(app, configs, async config => {
        await new Promise(resolve => setTimeout(resolve, 100 - config.priority))

        order.push(config.priority)

        return (req, res, next) => next()
      })

      assert.deepStrictEqual(order, [10, 20, 30])
    })
  })
})
