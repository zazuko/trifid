import rdf from 'rdf-ext'
import { entityBuilder } from '../lib/builder/entityBuilder.js'
import { entities } from '../lib/entities.js'

function trifid (cf, options = {
  preferredLanguages: ['de', 'fr', 'it', 'en'],
  compactMode: true,
  externalLabels: rdf.clownface({ dataset: rdf.dataset() })
}) {
  const builder = entityBuilder(cf)
    .embedNamed(options.embedNamed)
    .embedBlanks(options.embedBlanks)
    .embedLists(options.compactMode)
    .groupValuesByProperty(options.compactMode)
    .groupPropertiesByValue(options.compactMode)
    .maxLevel(options.maxLevel)
    .withExternalLabels(options.externalLabels)
    .withPreferredLanguages(options.preferredLanguages)

  return entities(cf, builder)
}

function trifidNamedGraphCounts (cf, options) {
  const namedGraphs = rdf.termMap()
  for (const quad of cf.any().dataset) {
    if (quad.graph) {
      const count = namedGraphs.get(quad.graph)
      const newCount = count !== undefined ? (count + 1) : 1
      namedGraphs.set(quad.graph, newCount)
    }
  }
  return namedGraphs
}

export { trifid, trifidNamedGraphCounts }
