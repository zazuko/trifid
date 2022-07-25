import rdf from 'rdf-ext'

function subjects (cf) {
  return [...rdf.termSet(quads(cf).map(quad => quad.subject))]
}

function predicates (cf) {
  return [...rdf.termSet(quads(cf).map(quad => quad.predicate))]
}

function quads (cf) {
  return [...cf.dataset.match(cf.term, null, null, null, null)]
}

export { subjects, predicates, quads }
