/* global describe, it */

const assert = require('assert')
const express = require('express')
const nock = require('nock')
const request = require('supertest')
const sparqlProxy = require('../lib/sparql-proxy')

describe('sparql-proxy', () => {
  it('should be a function', () => {
    assert.equal(typeof sparqlProxy, 'function')
  })

  it('should do nothing if config undefined', () => {
    let touched = false

    const router = {
      use: () => {
        touched = true
      }
    }

    sparqlProxy(router)

    assert(!touched)
  })

  it('should do nothing if no path is defined', () => {
    let touched = false

    const router = {
      use: () => {
        touched = true
      }
    }

    sparqlProxy(router, {})

    assert(!touched)
  })

  it('should proxy SPARQL queries', () => {
    const urlPath = '/test'

    const app = express()

    sparqlProxy(app, {
      path: urlPath,
      endpointUrl: 'http://example.org/query'
    })

    nock('http://example.org').post('/query').reply(200, 'test')

    return request(app)
      .get(urlPath + '?query=SELECT%20*%20WHERE%20%7B%3Fs%20%3Fp%20%3Fo.%7D%20LIMIT%2010')
      .expect(200)
      .then((res) => {
        assert.equal(res.text, 'test')
      })
  })
})
