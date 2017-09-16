/* global describe, it */

var assert = require('assert')
var express = require('express')
var mount = require('../lib/mount-middleware')
var request = require('supertest')

describe('mount-middleware', function () {
  it('should be a function', function () {
    assert.equal(typeof mount, 'function')
  })

  it('should handle null configs', function () {
    mount()
  })

  it('should mount path only configs', function () {
    var processed = []

    var app = express()

    var configs = {
      a: {
        path: '/a'
      },
      b: {
        path: '/b'
      }
    }

    mount(app, configs, function (configs) {
      return function (req, res, next) {
        processed.push(req.originalUrl)

        next()
      }
    })

    return Promise.all([
      request(app)
        .get('/a')
        .expect(404),
      request(app)
        .get('/b')
        .expect(404)
    ]).then(function () {
      assert.deepEqual(processed, ['/a', '/b'])
    })
  })

  it('should mount vhost configs', function () {
    var processed = []

    var app = express()

    var configs = {
      a: {
        hostname: 'example.org',
        path: '/a'
      },
      b: {
        hostname: 'example.com',
        path: '/b'
      }
    }

    mount.all(app, configs, function (configs) {
      return function (req, res, next) {
        processed.push(req.originalUrl)

        next()
      }
    })

    return Promise.all([
      request(app)
        .get('/a')
        .set('Host', 'example.org')
        .expect(404),
      request(app)
        .get('/a')
        .set('Host', 'example.com')
        .expect(404),
      request(app)
        .get('/b')
        .set('Host', 'example.org')
        .expect(404),
      request(app)
        .get('/b')
        .set('Host', 'example.com')
        .expect(404)
    ]).then(function () {
      assert.deepEqual(processed, ['/a', '/b'])
    })
  })
})
