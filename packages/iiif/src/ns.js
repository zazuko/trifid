import rdf from '@zazuko/env'

const ns = {
  iiifImage: rdf.namespace('http://iiif.io/api/image/3#'),
  iiifPrezi: rdf.namespace('http://iiif.io/api/presentation/3#'),
  dctypes: rdf.ns.dcmitype,
  exif: rdf.ns.exif,
  dcterms: rdf.ns.dcterms,
  schema: rdf.ns.schema,
  as: rdf.ns.as,
  oa: rdf.ns.oa,
  rdf: rdf.ns.rdf,
}

export default ns
