/* global describe, it */

import assert from 'assert'

import handleRedirect from '../src/handleRedirect.js'
import rdf from 'rdf-ext'
import { Parser } from 'n3'

const parser = new Parser()

function toDataset (str) {
  return rdf.dataset().addAll(parser.parse(str))
}

const ex = rdf.namespace('http://localhost:3000/')

describe('handleRedirect', () => {
  it('should be a function', () => {
    assert.strictEqual(typeof handleRedirect, 'function')
  })

  it('Does return undefined when no redirects found', () => {
    const term = ex.requestedUri
    const handle = handleRedirect({ term, dataset: rdf.dataset() })
    assert.strictEqual(handle, undefined)
  })

  it('Does a redirect with responseCode and location', () => {
    const dataset = toDataset(`
@prefix http:   <http://www.w3.org/2011/http#>.
@prefix ex:     <http://localhost:3000/> .

ex:req a http:GetRequest ;
    http:requestURI ex:requestedUri ;
    http:response   ex:resp .

ex:resp a http:Response ;
    <http://schema.org/validFrom> "2022-02-31T00:00:00Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;
    http:responseCode             http:301 ;
    http:location                 ex:targetLocation .
`)
    const term = ex.requestedUri
    const handle = handleRedirect({ term, dataset })

    let statusValue
    let redirectValue

    const res = {
      status: (value) => { statusValue = value },
      redirect: (value) => { redirectValue = value }
    }

    handle({}, res, {})
    assert.strictEqual(redirectValue, 'http://localhost:3000/targetLocation')
    assert.strictEqual(statusValue, 301)
  })

  it('Ignores a redirect without location', () => {
    const dataset = toDataset(`
@prefix http:   <http://www.w3.org/2011/http#>.
@prefix ex:     <http://localhost:3000/> .

ex:req a http:GetRequest ;
    http:requestURI ex:requestedUri ;
    http:response   ex:resp .

ex:resp a http:Response ;
    <http://schema.org/validFrom> "2022-02-31T00:00:00Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;
    http:responseCode             http:301 .
`)
    const term = ex.requestedUri
    const handle = handleRedirect({ term, dataset })

    assert.strictEqual(handle, undefined)
  })

  it('Does a redirect without responseCode', () => {
    const dataset = toDataset(`
@prefix http:   <http://www.w3.org/2011/http#>.
@prefix ex:     <http://localhost:3000/> .

ex:req a http:GetRequest ;
    http:requestURI ex:requestedUri ;
    http:response   ex:resp .

ex:resp a http:Response ;
    <http://schema.org/validFrom> "2022-02-31T00:00:00Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;
    http:responseCode             http:301 .
`)
    const term = ex.requestedUri
    const handle = handleRedirect({ term, dataset })

    assert.strictEqual(handle, undefined)
  })

  it('Do a redirect location and unknown response code', () => {
    const dataset = toDataset(`
@prefix http:   <http://www.w3.org/2011/http#>.
@prefix ex:     <http://localhost:3000/> .

ex:req a http:GetRequest ;
    http:requestURI ex:requestedUri ;
    http:response   ex:resp .

ex:resp a http:Response ;
    <http://schema.org/validFrom> "2022-02-31T00:00:00Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;
    http:responseCode             http:999 ;
    http:location                 ex:targetLocation .
`)
    const term = ex.requestedUri
    const handle = handleRedirect({ term, dataset })

    let statusValue
    let redirectValue

    const res = {
      status: (value) => { statusValue = value },
      redirect: (value) => { redirectValue = value }
    }

    handle({}, res, {})
    assert.strictEqual(redirectValue, 'http://localhost:3000/targetLocation')
    assert.strictEqual(statusValue, undefined)
  })
})
