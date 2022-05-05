/* global describe, it */

import assert from 'assert'
import express from 'express'
import request from 'supertest'
import errorHandler from '../../plugins/error-handler.js'

describe('error-handler', () => {
  it('should be a function', () => {
    assert.equal(typeof errorHandler, 'function')
  })

  it('should attach the error handler', () => {
    let touched = false

    const router = {
      use: () => {
        touched = true
      }
    }

    errorHandler(router)

    assert(touched)
  })

  it('should forward the status code', () => {
    const app = express()

    app.use((req, res, next) => {
      const err = new Error()

      err.statusCode = 501

      next(err)
    })

    errorHandler(app)

    return request(app)
      .get('/')
      .expect(501)
  })

  it('should use status code 500 if none was given', () => {
    const app = express()

    app.use((req, res, next) => {
      next(new Error())
    })

    errorHandler(app)

    return request(app)
      .get('/')
      .expect(500)
  })

  it('should send an empty body', () => {
    const app = express()

    app.use((req, res, next) => {
      next(new Error())
    })

    errorHandler(app)

    return request(app)
      .get('/')
      .then(res => {
        assert.equal(res.text, '')
      })
  })
})
