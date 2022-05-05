/* global describe, it */

import assert from 'assert'
import path, { dirname } from 'path'
import express from 'express'
import request from 'supertest'
import middleware from '../../plugins/middleware.js'
import context from '../support/context.js'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('middleware', () => {
  const dummyMiddlewarePath = path.join(__dirname, '../support/dummy-middleware.js')

  it('should be a function', () => {
    assert.equal(typeof middleware, 'function')
  })

  it('should create a single instance of the middleware and add it to the router', async () => {
    const app = express()

    const plugin = {
      middleware: dummyMiddlewarePath
    }

    await middleware.call(context, app, null, plugin)

    return request(app)
      .get('/')
      .then(res => {
        assert.deepEqual(res.body, { 0: {} })
      })
  })

  it('should create middleware with .apply if params are given', async () => {
    const app = express()

    const plugin = {
      middleware: dummyMiddlewarePath,
      params: [0, 1]
    }

    await middleware.call(context, app, null, plugin)

    return request(app)
      .get('/')
      .then(res => {
        assert.deepEqual(res.body, { 0: 0, 1: 1 })
      })
  })

  it('should create middleware with .call and forward config if no params are given', async () => {
    const app = express()

    const plugin = {
      middleware: dummyMiddlewarePath
    }

    await middleware.call(context, app, { a: { b: 'c' } }, plugin)

    return request(app)
      .get('/')
      .then(res => {
        assert.deepEqual(res.body, { 0: { b: 'c' } })
      })
  })
})
