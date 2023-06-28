import rdf from 'rdf-ext'

const ns = {
  http: rdf.namespace('http://www.w3.org/2011/http#'),
  rdf: rdf.namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#'),
  rdfs: rdf.namespace('http://www.w3.org/2000/01/rdf-schema#')
}

export { ns }
