import express from 'express'
import request from 'supertest'
import { describe, expect, test } from '@jest/globals'

import errorsMiddleware from '../../middlewares/errors.js'

describe('errors middleware', () => {
  test('should be a function', () => {
    expect(typeof errorsMiddleware).toEqual('function')
  })

  test('should return a 500 status code', async () => {
    const app = express()

    const throwingMiddleware = (_req, _res, _next) => {
      throw new Error('Oops, something went wrong…')
    }

    app.use(throwingMiddleware)
    app.use(errorsMiddleware({
      logger: {
        error: (_msg) => {}
      }
    }))

    return request(app)
      .get('/')
      .expect(500)
  })

  test('should forward status code', async () => {
    const app = express()

    const throwingMiddleware = (_req, res, _next) => {
      res.status(502).send('Something went wrong :-(')
    }

    app.use(throwingMiddleware)
    app.use(errorsMiddleware({
      logger: {
        error: (_msg) => {}
      }
    }))

    return request(app)
      .get('/')
      .expect(502)
  })

  test('should return an empty body', async () => {
    const app = express()

    const throwingMiddleware = (_req, _res, _next) => {
      throw new Error('Oops, something went wrong…')
    }

    app.use(throwingMiddleware)
    app.use(errorsMiddleware({
      logger: {
        error: (_msg) => {}
      }
    }))

    return request(app)
      .get('/')
      .expect('')
  })
})
