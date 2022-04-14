const rdfString = require('@tpluscode/rdf-string')
const ns = require('./ns.js')
const { sparql } = rdfString
const { as, dcterms, exif, iiif_image, iiif_prezi, oa, rdf, schema } = ns

function discoverManifest (iri) {
  return sparql`
CONSTRUCT {
  ?m a ${iiif_prezi.Manifest} ;
    ${as.items} ?manifestItems .

  ?manifestRest ${rdf.first} ?canvas ;
    ${rdf.rest} ?manifestTail .

  ?canvas a ${iiif_prezi.Canvas} ;
    ${as.items} ?canvasItems .

  ?canvasRest ${rdf.first} ?page ;
    ${rdf.rest} ?canvasTail .

  ?page a ${as.OrderedCollectionPage} ;
    ${as.items} ?pageItems .

  ?pageRest ${rdf.first} ?annotation ;
    ${rdf.rest} ?pageTail .

  ?annotation a ${oa.Annotation} ;
    ${oa.hasBody} ?body .

  ?body a ?dcmiType ;
    ${schema.potentialAction} ?service .

  ?service a ${iiif_image.ImageService} ;
    ${dcterms.conformsTo} ?serviceLevel ;
    ${dcterms.type} ?serviceType ;
    ${exif.height} ?serviceHeight ;
    ${exif.width} ?serviceWidth .
} WHERE {
  #pragma optimizer.property.paths.start off

  ?m a ${iiif_prezi.Manifest} ;
    ${as.items} ?manifestItems .

  ?manifestItems ${rdf.rest}* ?manifestRest .
  ?manifestRest ${rdf.first} ?canvas ;
    ${rdf.rest} ?manifestTail .

  ?canvas a ${iiif_prezi.Canvas} ;
    ${as.items} ?canvasItems .

  ?canvasItems ${rdf.rest}* ?canvasRest .
  ?canvasRest ${rdf.first} ?page ;
    ${rdf.rest} ?canvasTail .

  ?page a ${as.OrderedCollectionPage} ;
    ${as.items} ?pageItems .

  ?pageItems ${rdf.rest}* ?pageRest .
  ?pageRest ${rdf.first} ?annotation ;
    ${rdf.rest} ?pageTail .

  ?annotation a ${oa.Annotation} ;
    ${oa.hasBody} ?body .

  ?body a ?dcmiType .

  OPTIONAL {
    ?body ${schema.potentialAction} ?service .

    ?service a ${iiif_image.ImageService} ;
      ${dcterms.conformsTo} ?serviceLevel ;
      ${dcterms.type} ?serviceType ;
      ${exif.height} ?serviceHeight ;
      ${exif.width} ?serviceWidth .
  }

  VALUES ?m { ${iri} }
}
`.toString()
}

function describeNodes (nodes) {
  return nodes
    .reduce((acc, node) => sparql`${acc} ${node}`, sparql`DESCRIBE`)
    .toString()

}

function manifestExists (iri) {
  return sparql`ASK { ${iri} a ${iiif_prezi.Manifest} }`.toString()
}

module.exports = { discoverManifest, describeNodes, manifestExists }