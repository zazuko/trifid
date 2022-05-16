import express from 'express'
import request from 'supertest'
import { describe, expect, test } from '@jest/globals'

import redirectMiddleware from '../../middlewares/redirect.js'

describe('redirect middleware', () => {
  test('should be a function', () => {
    expect(typeof redirectMiddleware).toEqual('function')
  })

  test('should throw if the target parameter is not set', () => {
    expect(() => redirectMiddleware({ config: {} })).toThrow()
  })

  test('should redirect request', async () => {
    const app = express()

    app.use('/redirect', redirectMiddleware({
      config: {
        target: '/'
      }
    }))

    return request(app)
      .get('/redirect')
      .expect(302)
  })

  test('should not redirect request', async () => {
    const app = express()

    app.use('/redirect', redirectMiddleware({
      config: {
        target: '/'
      }
    }))

    return request(app)
      .get('/non-existant-route')
      .expect(404)
  })
})
