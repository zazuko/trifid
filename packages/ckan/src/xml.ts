import rdf from '@zazuko/env';
import prefixes, { shrink } from '@zazuko/prefixes';
import { create as createXml } from 'xmlbuilder2';
import { isBlankNode, isLiteral, isNamedNode } from 'is-graph-pointer';

import type { DatasetCore, NamedNode, Quad } from '@rdfjs/types';

// The clownface pointer chains below are intentionally typed loosely (`any`):
// modelling clownface's `MultiPointer`/`GraphPointer` generics through this
// serialization precisely is impractical, and the behaviour is covered by tests.

/**
 * Generate a CKAN-compatible XML representation of the dataset.
 *
 * @param dataset Dataset to convert.
 * @returns XML representation of the dataset.
 */
const toXML = (dataset: DatasetCore<Quad, Quad>): string => {
  const pointer = rdf.clownface({ dataset: rdf.dataset(dataset) });
  const datasetsPointer = pointer.node(rdf.ns.dcat.Dataset).in(rdf.ns.rdf.type);

  const pf = Object.entries(prefixes)
    // `xml` prefix is reserved and must not be re-declared
    .filter(([prefix]) => prefix !== 'xml')
    .reduce((acc, [prefix, url]) => ({ ...acc, [`xmlns:${prefix}`]: url }), {});

  return createXml({
    version: '1.0',
    encoding: 'utf-8',
    namespaceAlias: {
      rdf: prefixes.rdf,
      dcat: prefixes.dcat,
      dcterms: prefixes.dcterms,
      vcard: prefixes.vcard,
      foaf: prefixes.foaf,
    },
  }, {
    'rdf:RDF': {
      '@': pf,
      'dcat:Catalog': {
        'dcat:dataset': datasetsPointer.map((dataset: any) => {
          // Verify that identifiers is CKAN-valid, ignore the dataset otherwise
          const identifiers = dataset.out(rdf.ns.dcterms.identifier);
          if (!identifiers.value) {
            // eslint-disable-next-line no-console
            console.error(`Ignoring dataset ${dataset.value} because it has no or multiple identifiers`);
            return null;
          }

          // The initial query ensures that there is a creator
          const creators = dataset.out(rdf.ns.dcterms.creator);
          const creatorSlug = creators.values[0].split('/').slice(-1)[0];
          const identifier = identifiers.value.includes('@')
            ? identifiers.value
            : `${identifiers.value}@${creatorSlug}`;

          // Ignore keywords without a language specified because CKAN rejects them
          const keywords = dataset.out(rdf.ns.dcat.keyword).filter(({ term: { language } }: any) => !!language);

          const copyright = dataset.out(rdf.ns.dcterms.rights).out(rdf.ns.schema.identifier);

          const legalBasisPointer = dataset.out(rdf.ns.dcterms.license);
          const legalBasis = legalBasisPointer.term
            ? {
                'rdf:Description': {
                  '@': { 'rdf:about': legalBasisPointer.value },
                  'rdfs:label': 'legal_basis',
                },
              }
            : null;

          const workExampleDstributions = dataset.out(rdf.ns.schema.workExample)
            .filter((workExample: any) => workExample.out(rdf.ns.schema.encodingFormat).terms.length > 0)
            .map((workExample: any) => ({
              'dcat:Distribution': {
                '@': { 'rdf:about': workExample.out(rdf.ns.schema.url).value },
                'dcterms:issued': serializeTerm(dataset.out(rdf.ns.dcterms.issued)),
                'dcat:mediaType': serializeTerm(workExample.out(rdf.ns.schema.encodingFormat)),
                'dcat:accessURL': serializeTerm(workExample.out(rdf.ns.schema.url)),
                'dcterms:title': serializeTerm(workExample.out(rdf.ns.schema.name)),
                'dcterms:license': serializeTerm(copyright),
                'dcterms:format': {
                  '@': {
                    'rdf:resource': distributionFormatFromEncoding(workExample.out(rdf.ns.schema.encodingFormat)),
                  },
                },
              },
            }));

          const copiedDistributions = dataset.out(rdf.ns.dcat.distribution)
            .map((distribution: any, index: number) => ({
              'dcat:Distribution': {
                '@': { 'rdf:about': `${dataset.value}/distribution/${index + 1}` },
                'dcterms:issued': serializeTerm(dataset.out(rdf.ns.dcterms.issued)),
                'dcterms:modified': serializeTerm(dataset.out(rdf.ns.dcterms.modified)),
                'dcterms:license': serializeTerm(copyright),
                ...serializeProperties(distribution),
              },
            }));

          const publishers = dataset.out(rdf.ns.dcterms.publisher)
            .map((publisher: any) => {
              const attr: Record<string, string> = {};
              let name: string | string[] = publisher.value;

              if (isNamedNode(publisher)) {
                attr['rdf:about'] = publisher.value;
                if (publisher.out(rdf.ns.schema.name).values.length > 0) {
                  name = publisher.out(rdf.ns.schema.name).values;
                }
              }

              return {
                'foaf:Organization': {
                  '@': attr,
                  'foaf:name': name,
                },
              };
            });

          // Datasets contain a mix of legacy (DC) frequencies and new (EU) frequencies.
          // The query makes sure we get both legacy and new ones, we only
          // provide the new ones to CKAN, by converting legacy ones if needed.
          const euFreqPrefix = 'http://publications.europa.eu/resource/authority/frequency/';
          const accrualPeriodicity = dataset.out(rdf.ns.dcterms.accrualPeriodicity)
            .map((t: any) => {
              if (!t.term || !t.term.value) {
                return t;
              }
              // If the frequency is not a legacy frequency, it is returned unchanged.
              t.term.value = convertLegacyFrequency(t.term.value);
              return t;
            })
            .filter(({ term }: any) => term.value.startsWith(euFreqPrefix));

          return {
            'dcat:Dataset': {
              '@': { 'rdf:about': dataset.value },
              'dcterms:identifier': { '#': identifier },
              'dcterms:title': serializeTerm(dataset.out(rdf.ns.dcterms.title)),
              'dcterms:description': serializeTerm(dataset.out(rdf.ns.dcterms.description)),
              'dcterms:issued': serializeTerm(dataset.out(rdf.ns.dcterms.issued)),
              'dcterms:modified': serializeTerm(dataset.out(rdf.ns.dcterms.modified)),
              'dcterms:publisher': publishers,
              'dcterms:creator': serializeTerm(creators),
              'dcat:contactPoint': serializeBlankNode(
                dataset.out(rdf.ns.dcat.contactPoint),
                [rdf.ns.vcard.Organization, rdf.ns.vcard.Individual],
              ),
              'dcat:theme': serializeTerm(dataset.out(rdf.ns.dcat.theme)),
              'dcterms:language': serializeTerm(dataset.out(rdf.ns.dcterms.language)),
              'dcterms:relation': [
                legalBasis,
                serializeTerm(dataset.out(rdf.ns.dcterms.relation), { properties: [rdf.ns.rdfs.label] }),
              ],
              'dcat:keyword': serializeTerm(keywords),
              'dcat:landingPage': serializeTerm(dataset.out(rdf.ns.dcat.landingPage)),
              'dcterms:spatial': serializeTerm(dataset.out(rdf.ns.dcterms.spatial)),
              'dcterms:coverage': serializeTerm(dataset.out(rdf.ns.dcterms.coverage)),
              'dcterms:temporal': serializeTerm(dataset.out(rdf.ns.dcterms.temporal)),
              'dcterms:accrualPeriodicity': serializeTerm(accrualPeriodicity),
              'dcat:distribution': [
                ...workExampleDstributions,
                ...copiedDistributions,
              ],
              'foaf:page': serializeTerm(dataset.out(rdf.ns.foaf.page)),
            },
          };
        }).filter(Boolean),
      },
    },
  }).doc().end({ prettyPrint: true }).concat('\n');
};

/**
 * Serialize a term.
 *
 * @param pointer Pointer to serialize.
 * @param options Serialization options.
 */
const serializeTerm = (pointer: any, { properties = [] }: { properties?: NamedNode[] } = {}) => {
  return pointer.map((value: any) => {
    return serializeLiteral(value) || serializeNamedNode(value, properties) || serializeBlankNode(value) || {};
  });
};

/**
 * Serialize a literal.
 *
 * @param pointer Pointer to serialize.
 * @returns Serialized literal.
 */
const serializeLiteral = (pointer: any): Record<string, unknown> | null => {
  if (!isLiteral(pointer)) return null;

  const { term } = pointer;
  const attrs: Record<string, string> = {};

  if (term.language) {
    attrs['xml:lang'] = term.language;
  }

  if (term.datatype && !term.datatype.equals(rdf.ns.rdf.langString) && !term.datatype.equals(rdf.ns.xsd.string)) {
    attrs['rdf:datatype'] = term.datatype.value;
  }

  return {
    '@': attrs,
    '#': term.value,
  };
};

/**
 * Serialize a named node.
 *
 * @param pointer Pointer to serialize.
 * @param properties Properties to serialize.
 * @returns Serialized named node.
 */
const serializeNamedNode = (pointer: any, properties: NamedNode[] = []): Record<string, unknown> | null => {
  if (!isNamedNode(pointer)) return null;

  const propertyMap = properties.reduce((acc, property) => ({
    ...acc,
    [shrink(property.value)]: serializeTerm(pointer.out(property)),
  }), {});

  if (Object.keys(propertyMap).length > 0) {
    return {
      'rdf:Description': {
        '@': { 'rdf:about': pointer.value },
        ...propertyMap,
      },
    };
  }

  return {
    '@': { 'rdf:resource': pointer.value },
  };
};

/**
 * Serialize a blank node.
 *
 * @param pointer Pointer to serialize.
 * @param allowedTypesArr Allowed types for the blank node.
 * @returns Serialized blank node.
 */
const serializeBlankNode = (pointer: any, allowedTypesArr: NamedNode[] = []): Record<string, unknown> | null => {
  if (!isBlankNode(pointer)) return null;

  const allowedTypes = rdf.termSet(allowedTypesArr);
  const types = pointer.out(rdf.ns.rdf.type).terms;
  const type = types.find((term: any) => !allowedTypes.size || allowedTypes.has(term));

  if (!type) return {};

  return {
    [shrink(type.value)]: serializeProperties(pointer),
  };
};

function serializeProperties(pointer: any) {
  const properties = rdf.termSet([...pointer.dataset.match(pointer.term)]
    .map(({ predicate }) => predicate)
    .filter((term) => !term.equals(rdf.ns.rdf.type)));

  return [...properties].reduce((acc, property) =>
    ({ ...acc, [shrink(property.value)]: serializeTerm(pointer.out(property)) }), {});
}

/**
 * Convert encoding format to distribution format.
 *
 * @param encodingPointer Pointer to encoding format.
 * @returns Distribution format.
 */
const distributionFormatFromEncoding = (encodingPointer: any): string => {
  const encoding = encodingPointer.values[0] || '';

  switch (encoding) {
    case 'text/html': {
      return 'http://publications.europa.eu/resource/authority/file-type/HTML';
    }
    case 'application/sparql-query': {
      return 'http://publications.europa.eu/resource/authority/file-type/SPARQLQ';
    }
    default: {
      return `https://www.iana.org/assignments/media-types/${encoding}`;
    }
  }
};

/**
 * Convert legacy frequency to EU frequency if possible.
 * If the frequency is not a legacy frequency, it is returned unchanged.
 *
 * @param frequency Frequency to convert.
 * @returns Converted frequency.
 */
export const convertLegacyFrequency = (frequency: string): string => {
  const legacyFreqPrefix = 'http://purl.org/cld/freq';
  const euFreqPrefix = 'http://publications.europa.eu/resource/authority/frequency';

  switch (frequency) {
    case `${legacyFreqPrefix}/annual`:
      return `${euFreqPrefix}/ANNUAL`;
    case `${legacyFreqPrefix}/semiannual`:
      return `${euFreqPrefix}/ANNUAL_2`;
    case `${legacyFreqPrefix}/threeTimesAYear`:
      return `${euFreqPrefix}/ANNUAL_3`;
    case `${legacyFreqPrefix}/biennial`:
      return `${euFreqPrefix}/BIENNIAL`;
    case `${legacyFreqPrefix}/bimonthly`:
      return `${euFreqPrefix}/BIMONTHLY`;
    case `${legacyFreqPrefix}/biweekly`:
      return `${euFreqPrefix}/BIWEEKLY`;
    case `${legacyFreqPrefix}/continuous`:
      return `${euFreqPrefix}/CONT`;
    case `${legacyFreqPrefix}/daily`:
      return `${euFreqPrefix}/DAILY`;
    case `${legacyFreqPrefix}/irregular`:
      return `${euFreqPrefix}/IRREG`;
    case `${legacyFreqPrefix}/monthly`:
      return `${euFreqPrefix}/MONTHLY`;
    case `${legacyFreqPrefix}/semimonthly`:
      return `${euFreqPrefix}/MONTHLY_2`;
    case `${legacyFreqPrefix}/threeTimesAMonth`:
      return `${euFreqPrefix}/MONTHLY_3`;
    case `${legacyFreqPrefix}/quarterly`:
      return `${euFreqPrefix}/QUARTERLY`;
    case `${legacyFreqPrefix}/triennial`:
      return `${euFreqPrefix}/TRIENNIAL`;
    case `${legacyFreqPrefix}/weekly`:
      return `${euFreqPrefix}/WEEKLY`;
    case `${legacyFreqPrefix}/semiweekly`:
      return `${euFreqPrefix}/WEEKLY_2`;
    case `${legacyFreqPrefix}/threeTimesAWeek`:
      return `${euFreqPrefix}/WEEKLY_3`;
  }
  return frequency;
};

export { toXML };
