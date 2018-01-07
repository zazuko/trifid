/* global describe, it */

const assert = require('assert')
const context = require('../support/context')
const express = require('express')
const handler = require('../../plugins/handler')
const path = require('path')
const request = require('supertest')

describe('handler', () => {
  const dummyHandlerPath = path.join(__dirname, '../support/dummy-handler')

  const createHandlerConfigs = (callback) => {
    return {
      a: {
        module: dummyHandlerPath,
        options: {
          callback: callback
        }
      }
    }
  }

  it('should be a function', () => {
    assert.equal(typeof handler, 'function')
  })

  it('should use .absoluteUrl to generate the IRI', () => {
    let iri

    const exampleIri = 'http://example.org/'

    const app = express()

    app.use((req, res, next) => {
      req.absoluteUrl = () => {
        return exampleIri
      }

      next()
    })

    const configs = createHandlerConfigs((req, res, next) => {
      iri = req.iri

      next()
    })

    handler.call(context, app, configs)

    return request(app)
      .get('/')
      .expect(404)
      .then(() => {
        assert.equal(iri, exampleIri)
      })
  })

  it('should remove the search part of the IRI', () => {
    let iri

    const exampleIri = 'http://example.org/'

    const app = express()

    app.use((req, res, next) => {
      req.absoluteUrl = () => {
        return exampleIri + '?test=test'
      }

      next()
    })

    const configs = createHandlerConfigs((req, res, next) => {
      iri = req.iri

      next()
    })

    handler.call(context, app, configs)

    return request(app)
      .get('/')
      .expect(404)
      .then(() => {
        assert.equal(iri, exampleIri)
      })
  })

  it('should handle encoded IRIs', () => {
    let iri

    const exampleIri = 'http://example.org/%C3%BCmlaut'

    const app = express()

    app.use((req, res, next) => {
      req.absoluteUrl = () => {
        return exampleIri + '?test=test'
      }

      next()
    })

    const configs = createHandlerConfigs((req, res, next) => {
      iri = req.iri

      next()
    })

    handler.call(context, app, configs)

    return request(app)
      .get('/')
      .expect(404)
      .then(() => {
        assert.equal(iri, decodeURI(exampleIri))
      })
  })
})
