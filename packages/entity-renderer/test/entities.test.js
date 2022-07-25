import chai from 'chai'
import expect from 'expect'
import toMatchSnapshot from 'expect-mocha-snapshot'
import { describe, it } from 'mocha'
import rdf from 'rdf-ext'
import { entityBuilder } from '../lib/builder/entityBuilder.js'
import { entities } from '../lib/entities.js'
import { ns } from '../lib/namespaces.js'
import { toQuads } from './support/serialization.js'

expect.extend({ toMatchSnapshot })

const assert = chai.assert

function clown (turtle, term) {
  return rdf.clownface({ dataset: rdf.dataset().addAll(toQuads(turtle)), term: term })
}

describe('entities', () => {
  it('should be a function', () => {
    assert.equal(typeof entities, 'function')
  })
})

describe('tests', () => {
  it('do not repeat without compact', function () {
    const data = `
<a> <d> <e> ;
    <d> <e> .
<e> <b> <c>.
`
    const cf = clown(data, rdf.namedNode('a'))

    const compactMode = false

    const builder = entityBuilder(cf)
      .embedLists(compactMode)
      .groupValuesByProperty(compactMode)
      .groupPropertiesByValue(compactMode)
      .withExternalLabels(rdf.clownface({ dataset: rdf.dataset() }))
      .withPreferredLanguages(['de', 'fr', 'it', 'en'])

    const result = entities(cf, builder)

    expect(result).toMatchSnapshot(this)
  })

  it('do not repeat with compact', function () {
    const data = `
<a> <d> <e> ;
    <d> <e> .
<e> <b> <c>.
`

    const cf = clown(data, rdf.namedNode('a'))

    const compactMode = false

    const builder = entityBuilder(cf)
      .embedLists(compactMode)
      .groupValuesByProperty(compactMode)
      .groupPropertiesByValue(compactMode)
      .withExternalLabels(rdf.clownface({ dataset: rdf.dataset() }))
      .withPreferredLanguages(['de', 'fr', 'it', 'en'])

    const result = entities(cf, builder)

    expect(result).toMatchSnapshot(this)
  })

  it('fetch languages', function () {
    const data = `

<a> <${ns.schema.name}> "Or me" ;
    <${ns.schema.name}> "Me"@de .
`
    const cf = clown(data, rdf.namedNode('a'))

    const builder = entityBuilder(cf)
      .withExternalLabels(rdf.clownface({ dataset: rdf.dataset() }))
      .withPreferredLanguages(['de', 'fr', 'it', 'en'])

    const result = entities(cf, builder)

    expect(result).toMatchSnapshot(this)
  })
})
