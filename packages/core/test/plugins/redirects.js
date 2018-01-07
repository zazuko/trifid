/* global describe, it */

const assert = require('assert')
const context = require('../support/context')
const express = require('express')
const redirects = require('../../plugins/redirects')
const request = require('supertest')

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
