import rdf from 'rdf-ext'

function namedCounts (dataset) {
  const namedGraphs = rdf.termMap()
  for (const quad of dataset) {
    if (quad.graph) {
      const count = namedGraphs.get(quad.graph)
      const newCount = count !== undefined ? (count + 1) : 1
      namedGraphs.set(quad.graph, newCount)
    }
  }
  return namedGraphs
}

export { namedCounts }
