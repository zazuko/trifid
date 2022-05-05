/* global describe, it */

import absoluteUrl from 'absolute-url'
import assert from 'assert'
import path, { dirname } from 'path'
import express from 'express'
import request from 'supertest'
import handler from '../../plugins/handler.js'
import context from '../support/context.js'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('handler', () => {
  it('should be a function', () => {
    assert.equal(typeof handler, 'function')
  })

  it('should use the handler to process the request', async () => {
    const app = express()

    app.use((req, res, next) => {
      absoluteUrl.attach(req)

      req.iri = req.absoluteUrl()

      next()
    })

    const configs = {
      a: {
        module: path.join(__dirname, '../support/dummy-handler.js'),
        options: {
          callback: (req, res) => {
            res.set('content-type', 'application/ld+json')
            res.end('{}')
          }
        }
      }
    }

    await handler.call(context, app, configs)

    return request(app)
      .get('/')
      .expect('content-type', 'application/ld+json')
      .then(res => {
        assert.deepEqual(res.body, {})
      })
  })
})
