import express from 'express'
import request from 'supertest'
import { describe, expect, test } from '@jest/globals'

import healthMiddleware from '../../middlewares/health.js'

describe('health middleware', () => {
  test('should be a function', () => {
    expect(typeof healthMiddleware).toEqual('function')
  })

  test('should return expected content-type', async () => {
    const app = express()

    app.use('/health', healthMiddleware({
      logger: {
        debug: (_msg) => {}
      }
    }))

    return request(app)
      .get('/health')
      .expect('Content-Type', /text\/plain/)
  })

  test('should return expected body', async () => {
    const app = express()

    app.use('/health', healthMiddleware({
      logger: {
        debug: (_msg) => {}
      }
    }))

    return request(app)
      .get('/health')
      .expect('ok')
  })

  test('should return expected status code', async () => {
    const app = express()

    app.use('/health', healthMiddleware({
      logger: {
        debug: (_msg) => {}
      }
    }))

    return request(app)
      .get('/health')
      .expect(200)
  })

  test('should call health request with valid response', async () => {
    const app = express()

    app.use('/health', healthMiddleware({
      logger: {
        debug: (_msg) => {}
      }
    }))

    return request(app)
      .get('/health')
      .expect('Content-Type', /text\/plain/)
      .expect('ok')
      .expect(200)
  })

  test('should not call health request', async () => {
    const app = express()

    app.use('/health', healthMiddleware({
      logger: {
        debug: (_msg) => {}
      }
    }))

    return request(app)
      .get('/non-existant-route')
      .expect(404)
  })
})
