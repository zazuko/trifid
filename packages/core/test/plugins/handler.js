/* global describe, it */

const absoluteUrl = require('absolute-url')
const assert = require('assert')
const context = require('../support/context')
const express = require('express')
const handler = require('../../plugins/handler')
const path = require('path')
const request = require('supertest')

describe('handler', () => {
  it('should be a function', () => {
    assert.equal(typeof handler, 'function')
  })

  it('should use the handler to process the request', () => {
    const app = express()

    app.use((req, res, next) => {
      absoluteUrl.attach(req)

      req.iri = req.absoluteUrl()

      next()
    })

    const configs = {
      a: {
        module: path.join(__dirname, '../support/dummy-handler'),
        options: {
          callback: (req, res) => {
            res.set('content-type', 'application/ld+json')
            res.end('{}')
          }
        }
      }
    }

    handler.call(context, app, configs)

    return request(app)
      .get('/')
      .expect('content-type', 'application/ld+json')
      .then((res) => {
        assert.deepEqual(res.body, {})
      })
  })
})
