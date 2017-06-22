/* global describe, it */

var assert = require('assert')
var express = require('express')
var redirect = require('../lib/redirect')
var request = require('supertest')

describe('mount-middleware', function () {
  it('should be a function', function () {
    assert.equal(typeof redirect, 'function')
  })

  it('should ignore request with different path', function () {
    var app = express()

    var options = {
      a: {
        path: '/'
      }
    }

    redirect(app, options)

    return request(app)
      .get('/test')
      .expect(404)
  })

  it('should ignore request with different hostname', function () {
    var app = express()

    var options = {
      a: {
        hostname: 'example.org',
        path: '/'
      }
    }

    redirect(app, options)

    return request(app)
      .get('/')
      .set('Host', 'example.com')
      .expect(404)
  })

  it('should redirect request with matching path', function () {
    var app = express()

    var options = {
      a: {
        path: '/'
      }
    }

    redirect(app, options)

    return request(app)
      .get('/')
      .expect(302)
  })

  it('should redirect request with matching path and hostname', function () {
    var app = express()

    var options = {
      a: {
        hostname: 'example.org',
        path: '/'
      }
    }

    redirect(app, options)

    return request(app)
      .get('/')
      .set('Host', 'example.org')
      .expect(302)
  })
})
