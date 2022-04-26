/* global describe, it */

const assert = require('assert')
const url = require('url')
const express = require('express')
const request = require('supertest')
const iriPlugin = require('../../plugins/iri')
const context = require('../support/context')

describe('iri', () => {
  it('should be a function', () => {
    assert.equal(typeof iriPlugin, 'function')
  })

  it('should use .absoluteUrl to generate the IRI', () => {
    let iri

    const exampleIriString = 'http://example.org/'

    const app = express()

    app.use((req, res, next) => {
      req.absoluteUrl = () => {
        return exampleIriString
      }

      next()
    })

    iriPlugin.call(context, app)

    app.use((req, res, next) => {
      iri = req.iri

      next()
    })

    return request(app)
      .get('/')
      .then(() => {
        assert.equal(iri, exampleIriString)
      })
  })

  it('should remove the search part of the IRI', () => {
    let iri

    const exampleIri = new url.URL('http://example.org/')

    const app = express()

    iriPlugin.call(context, app)

    app.use((req, res, next) => {
      iri = req.iri

      next()
    })

    return request(app)
      .get('/?test=test')
      .set('host', exampleIri.host)
      .then(() => {
        assert.equal(iri, url.format(exampleIri))
      })
  })

  it('should handle encoded IRIs', () => {
    let iri

    const exampleIri = new url.URL('http://example.org/%C3%BCmlaut')

    const app = express()

    iriPlugin.call(context, app)

    app.use((req, res, next) => {
      iri = req.iri

      next()
    })

    return request(app)
      .get(exampleIri.pathname)
      .set('host', exampleIri.host)
      .then(() => {
        assert.equal(iri, decodeURI(url.format(exampleIri)))
      })
  })
})
