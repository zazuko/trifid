/* global describe, it */

const assert = require('assert')
const context = require('../support/context')
const express = require('express')
const middleware = require('../../plugins/middleware')
const path = require('path')
const request = require('supertest')

describe('middleware', () => {
  const dummyMiddlewarePath = path.join(__dirname, '../support/dummy-middleware')

  it('should be a function', () => {
    assert.equal(typeof middleware, 'function')
  })

  it('should create a single instance of the middleware and add it to the router', () => {
    const app = express()

    const plugin = {
      middleware: dummyMiddlewarePath
    }

    middleware.call(context, app, null, plugin)

    return request(app)
      .get('/')
      .then((res) => {
        assert.deepEqual(res.body, {0: {}})
      })
  })

  it('should create middleware with .apply if params are given', () => {
    const app = express()

    const plugin = {
      middleware: dummyMiddlewarePath,
      params: [0, 1]
    }

    middleware.call(context, app, null, plugin)

    return request(app)
      .get('/')
      .then((res) => {
        assert.deepEqual(res.body, {0: 0, 1: 1})
      })
  })

  it('should create middleware with .call and forward config if no params are given', () => {
    const app = express()

    const plugin = {
      middleware: dummyMiddlewarePath
    }

    middleware.call(context, app, {a: {b: 'c'}}, plugin)

    return request(app)
      .get('/')
      .then((res) => {
        assert.deepEqual(res.body, {0: {b: 'c'}})
      })
  })
})
