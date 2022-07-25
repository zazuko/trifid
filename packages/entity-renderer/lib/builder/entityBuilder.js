import rdf from 'rdf-ext'
import { ns } from '../namespaces.js'
import { groupByValue, sortProperties } from './groupAndSort.js'
import { getLabel } from './labels.js'
import { predicates } from './utils.js'

function nodeWithLabels (cf, options, context) {
  const label = getLabel(cf, options)
  const renderAs = options.renderAs(cf, options, context)

  return {
    term: cf.term, ...(label && { label }), ...(renderAs && { renderAs })
  }
}

function canEmbed (options, context) {
  return term => {
    return (term.termType === 'NamedNode' || term.termType === 'BlankNode') && !context.visited.has(term)
  }
}

function shouldEmbed (options, context) {
  return term => {
    if (term.termType === 'NamedNode' && !options.embedNamed) {
      return false
    }
    if (term.termType === 'BlankNode' && !options.embedBlanks) {
      return false
    }
    return !(options.maxLevel && (context.level >= options.maxLevel))
  }
}

// @TODO this should have the option: Breadth-first in addition to Depth-first
function getRows (cf, options, context) {
  return predicates(cf).filter(property => !options.ignoreProperties.has(property)).map(property => {
    const labeledProperty = nodeWithLabels(cf.node(property), options, context)
    const childContext = {
      ...context, level: context.level + 1, incomingProperty: property
    }
    const renderAsList = options.embedLists && cf.out(property).isList()
    const terms = renderAsList ? [...cf.out(property).list()].map(cf => cf.term) : cf.out(property).terms

    const values = terms.map(term => {
      const isCanEmbed = canEmbed(options, childContext)(term)
      const isShouldEmbed = shouldEmbed(options, childContext)(term)
      if (isCanEmbed && isShouldEmbed) {
        return getEntity(cf.node(term), options, childContext).entity
      } else if (isCanEmbed && !isShouldEmbed) {
        context.remainingEntities.push({ property: labeledProperty, term })
      }
      return nodeWithLabels(cf.node(term), options, childContext)
    })
    return {
      ...(renderAsList && { renderAs: 'List' }), properties: [labeledProperty], values
    }
  })
}

function getEntity (cf, options, context) {
  context.visited.add(cf.term)
  const rows = getRows(cf, options, context)

  // Already grouped by property. If groupValuesByProperty is false, expand.
  const byProperty = options.groupValuesByProperty ? rows : rows.map(row => row.values.map(value => {
    return {
      properties: row.properties, values: [value]
    }
  })).flat()
  const byValue = options.groupPropertiesByValue ? groupByValue(byProperty) : byProperty
  byValue.sort(sortProperties)
  const entity = {
    ...nodeWithLabels(cf, options, context), ...(byValue && byValue.length && { rows: byValue })
  }
  return { entity, context }
}

class EntityBuilder {
  constructor (cf) {
    this.cf = cf
    this.context = {
      level: 0, visited: rdf.termSet()
    }

    this.options = {
      incomingProperty: undefined,
      maxLevel: undefined,
      embedNamed: false,
      embedBlanks: true,
      groupValuesByProperty: true,
      groupPropertiesByValue: true,
      embedLists: true,
      labelProperties: [ns.foaf.name, ns.skos.prefLabel, ns.schema.name, ns.rdfs.label],
      externalLabels: rdf.clownface({ dataset: rdf.dataset() }),
      preferredLanguages: ['en'],
      ignoreProperties: rdf.termSet([]),
      renderAs: (cf, options, context) => {
        // Adds 'Image' tag to the specified properties
        if (context.incomingProperty) {
          for (const imageProperty of [ns.foaf.img, ns.schema.image]) {
            if (imageProperty.equals(context.incomingProperty)) {
              return 'Image'
              // return undefined
            }
          }
        }
        return undefined
      }
    }
  }

  withCf (cf) {
    this.cf = cf
    return this
  }

  withLabelProperties (namedNodeArray) {
    this.options.labelProperties = namedNodeArray
    return this
  }

  withExternalLabels (clownface) {
    this.options.externalLabels = clownface
    return this
  }

  withIgnoreProperties (namedNodeArray) {
    this.options.ignoreProperties = rdf.termSet(namedNodeArray)
    return this
  }

  groupValuesByProperty (boolean) {
    this.options.groupValuesByProperty = boolean
    return this
  }

  groupPropertiesByValue (boolean) {
    this.options.groupPropertiesByValue = boolean
    return this
  }

  embedLists (boolean) {
    this.options.embedLists = boolean
    return this
  }

  embedNamed (boolean) {
    this.options.embedNamed = boolean
    return this
  }

  embedBlanks (boolean) {
    this.options.embedBlanks = boolean
    return this
  }

  maxLevel (number) {
    this.options.maxLevel = number
    return this
  }

  withPreferredLanguages (preferredLanguages) {
    this.options.preferredLanguages = preferredLanguages
    return this
  }

  withVisited (visited) {
    this.context.visited = visited
    return this
  }

  withIncomingProperty (namedNode) {
    this.context.incomingProperty = namedNode
    return this
  }

  build () {
    return this.buildWithContext().entity
  }

  buildWithContext () {
    if (!this.cf) {
      throw Error('No context term')
    }
    this.context.remainingEntities = []
    return getEntity(this.cf, this.options, this.context)
  }
}

function entityBuilder (cf) {
  return new EntityBuilder(cf)
}

function defaultBuilder (cf, options = {
  preferredLanguages: ['de', 'fr', 'it', 'en'], compactMode: true, externalLabels: rdf.clownface({ dataset: rdf.dataset() })
}) {
  const builder = entityBuilder(cf).
    embedNamed(options.embedNamed).
    embedBlanks(options.embedBlanks).
    embedLists(options.embedLists).
    groupValuesByProperty(options.groupValuesByProperty).
    groupPropertiesByValue(options.groupPropertiesByValue).
    maxLevel(options.maxLevel).
    withExternalLabels(options.externalLabels).
    withPreferredLanguages(options.preferredLanguages)

  return builder
}


export { entityBuilder, defaultBuilder }
