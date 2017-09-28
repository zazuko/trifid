/* global describe, it */

const assert = require('assert')
const handler = require('../lib/handler')
const path = require('path')

describe('handler', () => {
  const dummyHandlerPath = path.join(__dirname, 'support/dummy-handler')

  it('should be a function', () => {
    assert.equal(typeof handler, 'function')
  })

  it('should call next if no options are given', () => {
    const obj = handler()

    return new Promise((resolve) => {
      obj(null, null, resolve)
    })
  })

  it('should call next if the method is unknown', () => {
    const exampleIri = 'http://example.org/'

    return new Promise((resolve) => {
      const obj = handler({
        module: dummyHandlerPath
      })

      obj({
        method: 'OPTIONS',
        absoluteUrl: () => {
          return exampleIri
        }
      }, null, resolve, exampleIri)
    })
  })

  it('should use .absoluteUrl to generate the IRI', () => {
    const exampleIri = 'http://example.org/'

    return new Promise((resolve) => {
      const obj = handler({
        module: dummyHandlerPath,
        options: {
          callback: (req, res, next, iri) => {
            assert.equal(iri, exampleIri)

            resolve()
          }
        }
      })

      obj({
        method: 'GET',
        absoluteUrl: () => {
          return exampleIri
        }
      }, null, null, exampleIri)
    })
  })

  it('should remove the search part of the IRI', () => {
    const exampleIri = 'http://example.org/'

    return new Promise((resolve) => {
      const obj = handler({
        module: dummyHandlerPath,
        options: {
          callback: (req, res, next, iri) => {
            assert.equal(iri, exampleIri)

            resolve()
          }
        }
      })

      obj({
        method: 'GET',
        absoluteUrl: () => {
          return exampleIri + '?test=test'
        }
      }, null, null, exampleIri)
    })
  })

  it('should handle encoded IRIs', () => {
    const exampleIri = 'http://example.org/%C3%BCmlaut'

    return new Promise((resolve) => {
      const obj = handler({
        module: dummyHandlerPath,
        options: {
          callback: (req, res, next, iri) => {
            assert.equal(iri, decodeURI(exampleIri))

            resolve()
          }
        }
      })

      obj({
        method: 'GET',
        absoluteUrl: () => exampleIri
      }, null, null, exampleIri)
    })
  })
})
