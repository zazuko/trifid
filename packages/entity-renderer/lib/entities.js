import rdf from 'rdf-ext'
import { subjects } from './builder/utils.js'

function entities (cf, entityBuilder) {
  const visited = rdf.termSet()
  const entities = []

  // If this clownface is pointing  to a term, render it first
  const allSubjects = cf.term ? [cf.term, ...subjects(cf.any()).filter(node => !node.equals(cf.term))] : subjects(cf.any())

  for (const subject of [...allSubjects]) {
    if (!visited.has(subject)) {
      const { entity } = entityBuilder.withCf(cf.node(subject)).withVisited(visited).buildWithContext()
      entities.push(entity)
    }
  }
  return entities
}

export { entities }
