/* global describe, it */

const assert = require('assert')
const context = require('../support/context')
const express = require('express')
const path = require('path')
const request = require('supertest')
const staticFiles = require('../../plugins/static-files')

describe('static-files', () => {
  it('should be a function', () => {
    assert.equal(typeof staticFiles, 'function')
  })

  it('should send a 404 if the file doesn\'t exist', () => {
    const app = express()

    const configs = {
      a: {
        path: '/',
        folder: path.join(__dirname, '..support')
      }
    }

    staticFiles.call(context, app, configs)

    return request(app)
      .get('/test.csv')
      .expect(404)
  })

  it('should send the file content', () => {
    const app = express()

    const configs = {
      a: {
        path: '/',
        folder: path.join(__dirname, '../support')
      }
    }

    staticFiles.call(context, app, configs)

    return request(app)
      .get('/test.txt')
      .expect(200)
      .then((res) => {
        assert.equal(res.text, 'test')
      })
  })
})
