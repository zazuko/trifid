/* global describe, it */

import assert from 'assert'
import express from 'express'
import request from 'supertest'
import redirects from '../../plugins/redirects.js'
import context from '../support/context.js'

describe('redirects', () => {
  it('should be a function', () => {
    assert.equal(typeof redirects, 'function')
  })

  it('should redirect request', () => {
    const app = express()

    const configs = {
      a: {
        path: '/'
      }
    }

    redirects.call(context, app, configs)

    return request(app)
      .get('/')
      .expect(302)
  })
})
