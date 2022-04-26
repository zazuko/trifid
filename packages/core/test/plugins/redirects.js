/* global describe, it */

const assert = require('assert')
const express = require('express')
const request = require('supertest')
const redirects = require('../../plugins/redirects')
const context = require('../support/context')

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
