import { sparql } from '@tpluscode/rdf-string'
import ns from './ns.js'

function discoverManifest (iri) {
  return sparql`
CONSTRUCT {
  ?m a ${ns.iiif_prezi.Manifest} ;
    ${ns.as.items} ?manifestItems .

  ?manifestRest ${ns.rdf.first} ?canvas ;
    ${ns.rdf.rest} ?manifestTail .

  ?canvas a ${ns.iiif_prezi.Canvas} ;
    ${ns.as.items} ?canvasItems .

  ?canvasRest ${ns.rdf.first} ?page ;
    ${ns.rdf.rest} ?canvasTail .

  ?page a ${ns.as.OrderedCollectionPage} ;
    ${ns.as.items} ?pageItems .

  ?pageRest ${ns.rdf.first} ?annotation ;
    ${ns.rdf.rest} ?pageTail .

  ?annotation a ${ns.oa.Annotation} ;
    ${ns.oa.hasBody} ?body .

  ?body a ?dcmiType ;
    ${ns.schema.potentialAction} ?service .

  ?service a ${ns.iiif_image.ImageService} ;
    ${ns.dcterms.conformsTo} ?serviceLevel ;
    ${ns.dcterms.type} ?serviceType ;
    ${ns.exif.height} ?serviceHeight ;
    ${ns.exif.width} ?serviceWidth .
} WHERE {
  #pragma optimizer.property.paths.start off

  ?m a ${ns.iiif_prezi.Manifest} ;
    ${ns.as.items} ?manifestItems .

  ?manifestItems ${ns.rdf.rest}* ?manifestRest .
  ?manifestRest ${ns.rdf.first} ?canvas ;
    ${ns.rdf.rest} ?manifestTail .

  ?canvas a ${ns.iiif_prezi.Canvas} ;
    ${ns.as.items} ?canvasItems .

  ?canvasItems ${ns.rdf.rest}* ?canvasRest .
  ?canvasRest ${ns.rdf.first} ?page ;
    ${ns.rdf.rest} ?canvasTail .

  ?page a ${ns.as.OrderedCollectionPage} ;
    ${ns.as.items} ?pageItems .

  ?pageItems ${ns.rdf.rest}* ?pageRest .
  ?pageRest ${ns.rdf.first} ?annotation ;
    ${ns.rdf.rest} ?pageTail .

  ?annotation a ${ns.oa.Annotation} ;
    ${ns.oa.hasBody} ?body .

  ?body a ?dcmiType .

  OPTIONAL {
    ?body ${ns.schema.potentialAction} ?service .

    ?service a ${ns.iiif_image.ImageService} ;
      ${ns.dcterms.conformsTo} ?serviceLevel ;
      ${ns.dcterms.type} ?serviceType ;
      ${ns.exif.height} ?serviceHeight ;
      ${ns.exif.width} ?serviceWidth .
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
  return sparql`ASK { ${iri} a ${ns.iiif_prezi.Manifest} }`.toString()
}

export default { discoverManifest, describeNodes, manifestExists }
