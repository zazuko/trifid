import express from 'express'
import request from 'supertest'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, test } from '@jest/globals'

import staticMiddleware from '../../middlewares/static.js'

describe('static middleware', () => {
  test('should be a function', () => {
    expect(typeof staticMiddleware).toEqual('function')
  })

  test('should throw if the directory parameter is not set', () => {
    expect(() => staticMiddleware({ config: {} })).toThrow()
  })

  test('should not throw if the directory parameter is set', () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    expect(() => staticMiddleware({
      config: {
        directory: `${currentDir}/../support/`
      }
    })).not.toThrow()
  })

  test('should serve the specified resource', () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    const app = express()

    app.use(staticMiddleware({
      config: {
        directory: `${currentDir}/../support`
      }
    }))

    return request(app)
      .get('/test.txt')
      .expect(200)
      .expect('Content-Type', /text\/plain/)
      .expect(/some text/)
  })

  test('should return a 404 on non-existant resources', () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    const app = express()

    app.use(staticMiddleware({
      config: {
        directory: `${currentDir}/../support/`
      }
    }))

    return request(app)
      .get('/test-not-exist.txt')
      .expect(404)
  })
})
