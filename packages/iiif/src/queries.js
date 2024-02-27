import { sparql } from '@tpluscode/rdf-string'
import ns from './ns.js'

const { as, dcterms, exif, iiifImage, iiifPrezi, oa, rdf, schema } = ns

const discoverManifest = (iri) => {
  return sparql`
CONSTRUCT {
  ?m a ${iiifPrezi.Manifest} ;
    ${as.items} ?manifestItems .

  ?manifestRest ${rdf.first} ?canvas ;
    ${rdf.rest} ?manifestTail .

  ?canvas a ${iiifPrezi.Canvas} ;
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

  ?service a ${iiifImage.ImageService} ;
    ${dcterms.conformsTo} ?serviceLevel ;
    ${dcterms.type} ?serviceType ;
    ${exif.height} ?serviceHeight ;
    ${exif.width} ?serviceWidth .
} WHERE {
  #pragma optimizer.property.paths.start off

  ?m a ${iiifPrezi.Manifest} ;
    ${as.items} ?manifestItems .

  ?manifestItems ${rdf.rest}* ?manifestRest .
  ?manifestRest ${rdf.first} ?canvas ;
    ${rdf.rest} ?manifestTail .

  ?canvas a ${iiifPrezi.Canvas} ;
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

    ?service a ${iiifImage.ImageService} ;
      ${dcterms.conformsTo} ?serviceLevel ;
      ${dcterms.type} ?serviceType ;
      ${exif.height} ?serviceHeight ;
      ${exif.width} ?serviceWidth .
  }

  VALUES ?m { ${iri} }
}
`.toString()
}

const describeNodes = (nodes) => {
  return nodes
    .reduce((acc, node) => sparql`${acc} ${node}`, sparql`DESCRIBE`)
    .toString()
}

const manifestExists = (iri) => {
  return sparql`ASK { ${iri} a ${iiifPrezi.Manifest} }`.toString()
}

export default { discoverManifest, describeNodes, manifestExists }
