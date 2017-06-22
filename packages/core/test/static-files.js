/* global describe, it */

var assert = require('assert')
var express = require('express')
var path = require('path')
var request = require('supertest')
var staticFiles = require('../lib/static-files')

describe('static-files', function () {
  it('should be a function', function () {
    assert.equal(typeof staticFiles, 'function')
  })

  it('should ignore request with different path', function () {
    var app = express()

    var options = {
      a: {
        path: '/',
        folder: path.join(__dirname, 'support')
      }
    }

    staticFiles(app, options)

    return request(app)
      .get('/')
      .expect(404)
  })

  it('should ignore request with different hostname', function () {
    var app = express()

    var options = {
      a: {
        hostname: 'example.org',
        path: '/',
        folder: path.join(__dirname, 'support')
      }
    }

    staticFiles(app, options)

    return request(app)
      .get('/test.txt')
      .set('Host', 'example.com')
      .expect(404)
  })

  it('should send the file content', function () {
    var app = express()

    var options = {
      a: {
        path: '/',
        folder: path.join(__dirname, 'support')
      }
    }

    staticFiles(app, options)

    return request(app)
      .get('/test.txt')
      .expect(200)
  })

  it('should send the file content with matching vhost', function () {
    var app = express()

    var options = {
      a: {
        hostname: 'example.org',
        path: '/',
        folder: path.join(__dirname, 'support')
      }
    }

    staticFiles(app, options)

    return request(app)
      .get('/test.txt')
      .set('Host', 'example.org')
      .expect(200)
  })
})
