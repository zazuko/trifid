/* global describe, it */

import assert from 'assert'
import path, { dirname } from 'path'
import express from 'express'
import request from 'supertest'
import staticFiles from '../../plugins/static-files.js'
import context from '../support/context.js'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

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
      .then(res => {
        assert.equal(res.text, 'test')
      })
  })
})
