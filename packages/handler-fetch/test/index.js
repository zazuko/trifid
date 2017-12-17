/* global describe, it */

const assert = require('assert')
const express = require('express')
const fs = require('fs')
const path = require('path')
const request = require('supertest')
const url = require('url')
const Handler = require('..')

describe('trifid-handler-fetch', () => {
  const fileUrlDataset = 'file://' + require.resolve('tbbt-ld/dist/tbbt.nq')

  const attachIri = (req, res, next) => {
    req.iri = url.resolve('http://localhost:8080/', decodeURI(req.url))

    next()
  }

  it('should be a constructor', () => {
    assert.equal(typeof Handler, 'function')
  })

  it('should assign url option', () => {
    const handler = new Handler({url: 'test'})

    assert.equal(handler.url, 'test')
  })

  it('should assign cache option', () => {
    const handler = new Handler({cache: 'test'})

    assert.equal(handler.cache, 'test')
  })

  it('should assign contentType option', () => {
    const handler = new Handler({contentType: 'test'})

    assert.equal(handler.contentType, 'test')
  })

  it('should assign options option', () => {
    const handler = new Handler({options: 'test'})

    assert.equal(handler.options, 'test')
  })

  it('should assign resource option', () => {
    const handler = new Handler({resource: 'test'})

    assert.equal(handler.resource, 'test')
  })

  it('should assign split option', () => {
    const handler = new Handler({split: 'test'})

    assert.equal(handler.split, 'test')
  })

  it('should implement the handler interface', () => {
    const handler = new Handler({url: fileUrlDataset})

    assert.equal(typeof handler.handle, 'function')
  })

  it('should implement the legazy handler interface', () => {
    const handler = new Handler({url: fileUrlDataset})

    assert.equal(typeof handler.get, 'function')
  })

  it('should send a response', () => {
    const includeNt = '<http://localhost:8080/data/person/amy-farrah-fowler><http://www.w3.org/1999/02/22-rdf-syntax-ns#type><http://schema.org/Person>.'
    const excludeNt = '<http://localhost:8080/data/person/sheldon-cooper><http://www.w3.org/1999/02/22-rdf-syntax-ns#type><http://schema.org/Person>.'

    const app = express()

    const handler = new Handler({
      url: fileUrlDataset,
      options: {
        contentTypeLookup: () => {
          return 'application/n-quads'
        }
      }
    })

    app.use(attachIri)
    app.use(handler.handle)

    return request(app)
      .get('/data/person/amy-farrah-fowler')
      .set('accept', 'text/turtle')
      .then((res) => {
        const text = res.text.split(' ').join('')

        assert.notEqual(text.indexOf(includeNt), -1)
        assert.equal(text.indexOf(excludeNt), -1)
      })
  })

  it('should compact JSON-LD responses', () => {
    const app = express()

    const handler = new Handler({
      url: fileUrlDataset,
      options: {
        contentTypeLookup: () => {
          return 'application/n-quads'
        }
      }
    })

    app.use(attachIri)
    app.use(handler.handle)

    return request(app)
      .get('/data/person/amy-farrah-fowler')
      .set('accept', 'application/ld+json')
      .then((res) => {
        const jsonld = JSON.parse(res.text)

        assert(!Array.isArray(jsonld))
        assert.equal(jsonld['@id'], 'http://localhost:8080/data/person/amy-farrah-fowler')
        assert.equal(jsonld['http://schema.org/givenName'], 'Amy')
      })
  })

  it('should send a 404 response for unknown resources', () => {
    const app = express()

    const handler = new Handler({
      url: fileUrlDataset,
      options: {
        contentTypeLookup: () => {
          return 'application/n-quads'
        }
      }
    })

    app.use(attachIri)
    app.use(handler.handle)

    return request(app)
      .get('/data/person/dr-who')
      .set('accept', 'text/turtle')
      .expect(404)
  })

  it('should cache the dataset if cache option is true', () => {
    const base = 'http://localhost:8080'
    const fileUrl = 'file://' + path.join(__dirname, 'test.nt')

    const datasetBefore =
      `<${base}/subject0> <${base}/predicate> "object0" .\n<${base}/subject1> <${base}/predicate> "object1" .\n`

    const datasetAfter =
      `<${base}/subject0> <${base}/predicate> "object0" .\n<${base}/subject0> <${base}/predicate> "object1" .\n`

    const app = express()

    const handler = new Handler({
      url: fileUrl,
      options: {
        contentTypeLookup: () => {
          return 'application/n-triples'
        }
      },
      cache: true,
      split: true
    })

    app.use(attachIri)
    app.use(handler.handle)

    fs.writeFileSync(url.parse(fileUrl).path, datasetBefore)

    return request(app)
      .get('/subject1')
      .set('accept', 'text/turtle')
      .expect(200)
      .then(() => {
        fs.writeFileSync(url.parse(fileUrl).path, datasetAfter)

        return request(app)
          .get('/subject1')
          .set('accept', 'text/turtle')
          .expect(200)
      })
  })

  it('should not cache the dataset if cache options is not true', () => {
    const base = 'http://localhost:8080'
    const fileUrl = 'file://' + path.join(__dirname, 'test.nt')

    const datasetBefore =
      `<${base}/subject0> <${base}/predicate> "object0" .\n<${base}/subject1> <${base}/predicate> "object1" .\n`

    const datasetAfter =
      `<${base}/subject0> <${base}/predicate> "object0" .\n<${base}/subject0> <${base}/predicate> "object1" .\n`

    const app = express()

    const handler = new Handler({
      url: fileUrl,
      options: {
        contentTypeLookup: () => {
          return 'application/n-triples'
        }
      },
      split: true
    })

    app.use(attachIri)
    app.use(handler.handle)

    fs.writeFileSync(url.parse(fileUrl).path, datasetBefore)

    return request(app)
      .get('/subject1')
      .set('accept', 'text/turtle')
      .expect(200)
      .then(() => {
        fs.writeFileSync(url.parse(fileUrl).path, datasetAfter)

        return request(app)
          .get('/subject1')
          .set('accept', 'text/turtle')
          .expect(404)
      }).then(() => {
        fs.unlinkSync(url.parse(fileUrl).path)
      })
  })

  it('should implement the legacy interface', () => {
    const app = express()

    const handler = new Handler({
      url: fileUrlDataset,
      options: {
        contentTypeLookup: () => {
          return 'application/n-quads'
        }
      }
    })

    app.use(attachIri)
    app.use((req, res, next) => {
      handler.get(req, res, next, req.iri)
    })

    return request(app)
      .get('/data/person/amy-farrah-fowler')
      .set('accept', 'text/turtle')
      .expect(200)
  })
})
