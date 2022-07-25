import rdf from 'rdf-ext'

const ns = {
  schema: rdf.namespace('http://schema.org/'),
  vault: rdf.namespace('http://vault.org/'),
  rdf: rdf.namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#'),
  rdfs: rdf.namespace('http://www.w3.org/2000/01/rdf-schema#'),
  skos: rdf.namespace('http://www.w3.org/2004/02/skos/core#'),
  local: rdf.namespace('http://localhost:8080/data/'),
  foaf: rdf.namespace('http://xmlns.com/foaf/0.1/'),
  ex: rdf.namespace('http://example.org/'),
  purl: rdf.namespace('http://purl.org/dc/terms/'),
  locn: rdf.namespace('http://www.w3.org/ns/locn#'),
  xsd: rdf.namespace('http://www.w3.org/2001/XMLSchema#')
}

export { ns }
