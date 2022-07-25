import chai from 'chai'

import schema from 'chai-json-schema'

import expect from 'expect'
import toMatchSnapshot from 'expect-mocha-snapshot'
import { describe, it } from 'mocha'
import rdf from 'rdf-ext'
import { entityBuilder } from '../lib/builder/entityBuilder.js'
import { ns } from '../lib/namespaces.js'
import { toQuads } from './support/serialization.js'

expect.extend({ toMatchSnapshot })

const assert = chai.assert

chai.use(schema)

function clown (turtle, term) {
  return rdf.clownface({ dataset: rdf.dataset().addAll(toQuads(turtle)), term: term })
}

const entitySchema = {
  title: 'entity',
  type: 'object',
  properties: {
    required: ['termType', 'label'],
    termType: {
      type: 'string',
      enum: ['BlankNode', 'NamedNode', 'Literal']
    },
    label: {
      type: 'object',
      required: ['string'],
      properties: {
        string: {
          type: 'string'
        },
        vocab: {
          type: 'string'
        },
        language: {
          type: 'string'
        }
      }
    },
    url: {
      type: 'string'
    },
    term: {
      type: 'object',
      properties: {
        value: {
          type: 'string'
        },
        termType: {
          type: 'string'
        }
      }
    },
    rows: {
      type: 'array',
      properties: {
        title: 'row',
        required: ['properties', 'values'],
        properties: {
          renderAs: {
            type: 'string'
          },
          properties: {
            type: 'array',
            items: {
              $ref: '#'
            }
          },
          values: {
            type: 'array',
            items: {
              $ref: '#'
            }
          }
        }
      }
    }
  }
}

describe('entity', () => {
  it('should be a function', () => {
    assert.equal(typeof entityBuilder, 'function')
  })

  it('should create a model', () => {
    const data = '<a> <b> <c>.'
    const cf = clown(data, rdf.namedNode('a'))
    const result = entityBuilder(cf).build()

    assert.jsonSchema(result, entitySchema)
  })

  it('embeds blank nodes', () => {
    const data = '<a> <a> [ <a> [ <a> [ <a> [ <a> <a> ] ] ] ] .'
    const cf = clown(data, rdf.namedNode('a'))
    const result = entityBuilder(cf).build()

    assert.jsonSchema(result, entitySchema)
  })

  it('breaks circular references', () => {
    const data = '_:a <a> [ <b> _:a] .'
    const cf = clown(data, rdf.blankNode('_:a'))

    for (const quad of cf.dataset) {
      const result = entityBuilder(cf).build()

      assert.jsonSchema(result, entitySchema)
    }
  })
})

const battery = {

  simple: [
    `
<a> <b> <c> .
`, rdf.namedNode('a')],

  literal: [
    `
<a> <b> "c" .
`, rdf.namedNode('a')],

  'groups attributes': [
    `
<a> <b> <c> ;
    <b> <d> .
`, rdf.namedNode('a')],

  'groups by value': [
    `
<a> <b> <d> ;
    <c> <d> .
`, rdf.namedNode('a')],

  'does not repeat': [
    `
<a> <b> <c> ;
    <b> <c> .
`, rdf.namedNode('a')],

  'blank node': [
    `
<a> <b> [ <c> <d> ] .
`, rdf.namedNode('a')],

  list: [
    `
<a> <b> ( <c> <d> ) .
`, rdf.namedNode('a')],

  'subject label skos': [
    `
<a> <b> <c> .
<a> <${ns.skos.prefLabel}> "skos a" .
`, rdf.namedNode('a')],

  'subject label rdfs': [
    `
<a> <b> <c> .
<a> <${ns.rdfs.label}> "rdfs a" .
`, rdf.namedNode('a')],

  'subject label foaf': [
    `
<a> <b> <c> .
<a> <${ns.foaf.name}> "foaf a" .
`, rdf.namedNode('a')],

  'subject label schema': [
    `
<a> <b> <c> .
<a> <${ns.schema.name}> "schema a" .
`, rdf.namedNode('a')],

  'predicate label skos': [
    `
<a> <b> <c> .
<b> <${ns.skos.prefLabel}> "skos b" .
`, rdf.namedNode('a')],

  'predicate label rdfs': [
    `
<a> <b> <c> .
<b> <${ns.rdfs.label}> "rdfs b" .
`, rdf.namedNode('a')],

  'predicate label foaf': [
    `
<a> <b> <c> .
<b> <${ns.foaf.name}> "foaf b" .
`, rdf.namedNode('a')],

  'predicate label schema': [
    `
<a> <b> <c> .
<b> <${ns.schema.name}> "schema b" .
`, rdf.namedNode('a')],

  'object label skos': [
    `
<a> <b> <c> .
<c> <${ns.skos.prefLabel}> "skos c" .
`, rdf.namedNode('a')],

  'object label rdfs': [
    `
<a> <b> <c> .
<c> <${ns.rdfs.label}> "rdfs c" .
`, rdf.namedNode('a')],

  'object label foaf': [
    `
<a> <b> <c> .
<c> <${ns.foaf.name}> "foaf c" .
`, rdf.namedNode('a')],

  'object label schema': [
    `
<a> <b> <c> .
<c> <${ns.schema.name}> "schema c" .
`, rdf.namedNode('a')],

  'foaf image': [
    `
<a> <${ns.foaf.img}> <little-cat> .
`, rdf.namedNode('a')],

  'schema image': [
    `
<a> <${ns.schema.image}> <little-cat> .
`, rdf.namedNode('a')],

  languages: [
    `
<a> <b> <c> .
<a> <${ns.skos.prefLabel}> "skos a" .
<a> <${ns.skos.prefLabel}> "prefered"@en .
`, rdf.namedNode('a')]
}

describe('default', () => {
  for (const [testName, [turtle, term]] of Object.entries(battery)) {
    it(testName, function () {
      const cf = clown(turtle, term)
      const result = entityBuilder(cf).build()

      expect(
        [turtle, term, result]
      ).toMatchSnapshot(this)

      assert.jsonSchema(result, entitySchema)
    })
  }
})

describe('ignore property', () => {
  for (const [testName, [turtle, term]] of Object.entries(battery)) {
    it(testName, function () {
      const cf = clown(turtle, term)
      const result = entityBuilder(cf).embedNamed(true).embedBlanks(true).withIgnoreProperties([ns.rdfs.label]).build()

      expect(
        [turtle, term, result]
      ).toMatchSnapshot(this)

      assert.jsonSchema(result, entitySchema)
    })
  }
})

describe('no grouping by value or property', () => {
  for (const [testName, [turtle, term]] of Object.entries(battery)) {
    it(testName, function () {
      const cf = clown(turtle, term)
      const result = entityBuilder(cf).groupValuesByProperty(false).groupPropertiesByValue(false).embedNamed(true).embedBlanks(true).build()

      expect(
        [turtle, term, result]
      ).toMatchSnapshot(this)

      assert.jsonSchema(result, entitySchema)
    })
  }
})
