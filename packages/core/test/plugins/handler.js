/* global describe, it */

const assert = require('assert')
const path = require('path')
const absoluteUrl = require('absolute-url')
const express = require('express')
const request = require('supertest')
const handler = require('../../plugins/handler')
const context = require('../support/context')

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
      .then(res => {
        assert.deepEqual(res.body, {})
      })
  })
})
