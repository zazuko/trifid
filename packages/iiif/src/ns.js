const namespace = require('@rdfjs/namespace')

const iiif_image = namespace('http://iiif.io/api/image/3#')
const iiif_prezi = namespace('http://iiif.io/api/presentation/3#')
const dctypes = namespace('http://purl.org/dc/dcmitype/')
const exif = namespace('http://www.w3.org/2003/12/exif/ns#')
const dcterms = namespace('http://purl.org/dc/terms/')
const schema = namespace('https://schema.org/')
const as = namespace('http://www.w3.org/ns/activitystreams#')
const oa = namespace('http://www.w3.org/ns/oa#')
const rdf = namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')

module.exports = {
  as,
  dcterms,
  exif,
  iiif_image,
  iiif_prezi,
  oa,
  rdf,
  schema,
  dctypes
}
