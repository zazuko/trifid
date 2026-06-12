import rdf from '@zazuko/env';

// Explicit annotations (anchored on the `rdf` import) so the emitted
// declaration does not have to reference the deep, non-portable vocabulary
// paths of `@tpluscode/rdf-ns-builders`.
interface NamespaceMap {
  iiifImage: ReturnType<typeof rdf.namespace>;
  iiifPrezi: ReturnType<typeof rdf.namespace>;
  dctypes: typeof rdf.ns.dcmitype;
  exif: typeof rdf.ns.exif;
  dcterms: typeof rdf.ns.dcterms;
  schema: typeof rdf.ns.schema;
  as: typeof rdf.ns.as;
  oa: typeof rdf.ns.oa;
  rdf: typeof rdf.ns.rdf;
}

const ns: NamespaceMap = {
  iiifImage: rdf.namespace('http://iiif.io/api/image/3#'),
  iiifPrezi: rdf.namespace('http://iiif.io/api/presentation/3#'),
  dctypes: rdf.ns.dcmitype,
  exif: rdf.ns.exif,
  dcterms: rdf.ns.dcterms,
  schema: rdf.ns.schema,
  as: rdf.ns.as,
  oa: rdf.ns.oa,
  rdf: rdf.ns.rdf,
};

export default ns;
