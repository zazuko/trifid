import rdf from '@zazuko/env'
import prefixes, { shrink } from '@zazuko/prefixes'
import { create as createXml } from 'xmlbuilder2'
import * as ns from './namespace.js'

function toXML (dataset) {
  const pointer = rdf.clownface({ dataset: rdf.dataset(dataset) })
  const datasetsPointer = pointer.node(ns.dcat.Dataset).in(ns.rdf.type)

  const pf = Object.entries(prefixes)
    // `xml` prefix is reserved and must not be re-declared
    .filter(([prefix]) => prefix !== 'xml')
    .reduce((acc, [prefix, url]) => ({ ...acc, [`xmlns:${prefix}`]: url }), {})

  // add the `dct` prefix as an alias for `dcterms`
  pf['xmlns:dct'] = pf['xmlns:dcterms']

  return createXml({
    version: '1.0',
    encoding: 'utf-8',
    namespaceAlias: {
      rdf: prefixes.rdf,
      dcat: prefixes.dcat,
      dct: prefixes.dcterms,
      vcard: prefixes.vcard,
    },
  }, {
    'rdf:RDF': {
      '@': pf,
      'dcat:Catalog': {
        'dcat:dataset': datasetsPointer.map((dataset) => {
          // Verify that identifiers is CKAN-valid, ignore the dataset otherwise
          const identifiers = dataset.out(ns.dcterms.identifier)
          if (!identifiers.value) {
            // eslint-disable-next-line no-console
            console.error(`Ignoring dataset ${dataset.value} because it has no or multiple identifiers`)
            return null
          }

          // The initial query ensures that there is a creator
          const creators = dataset.out(ns.dcterms.creator)
          const creatorSlug = creators.values[0].split('/').slice(-1)[0]
          const identifier = identifiers.value.includes('@')
            ? identifiers.value
            : `${identifiers.value}@${creatorSlug}`

          // Ignore keywords without a language specified because CKAN rejects them
          const keywords = dataset.out(ns.dcat.keyword).filter(({ term: { language } }) => !!language)

          const copyright = dataset.out(ns.dcterms.rights).out(ns.schema.identifier)

          const legalBasisPointer = dataset.out(ns.dcterms.license)
          const legalBasis = legalBasisPointer.term
            ? {
              'rdf:Description': {
                '@': { 'rdf:about': legalBasisPointer.value },
                'rdfs:label': 'legal_basis',
              },
            }
            : null

          const distributions = dataset.out(ns.schema.workExample)
            .filter(workExample => workExample.out(ns.schema.encodingFormat).terms.length > 0)
            .map(workExample => ({
              'dcat:Distribution': {
                'dct:issued': serializeTerm(dataset.out(ns.dcterms.issued)),
                'dcat:mediaType': serializeTerm(workExample.out(ns.schema.encodingFormat)),
                'dcat:accessURL': serializeTerm(workExample.out(ns.schema.url)),
                'dct:title': serializeTerm(workExample.out(ns.schema.name)),
                'dct:rights': serializeTerm(copyright),
                'dct:format': { '#': distributionFormatFromEncoding(workExample.out(ns.schema.encodingFormat)) },
              },
            }))

          const publishers = dataset.out(ns.dcterms.publisher)
            .map(publisher => ({
              'rdf:Description': {
                'rdfs:label': publisher.value,
              },
            }))

          // Datasets contain a mix of legacy (DC) frequencies and new (EU) frequencies.
          // The query makes sure we get both legacy and new ones, we only
          // provide the legacy ones to CKAN.
          const legacyFreqPrefix = 'http://purl.org/cld/freq/'
          const accrualPeriodicity = dataset.out(ns.dcterms.accrualPeriodicity)
            .filter(({ term }) => term.value.startsWith(legacyFreqPrefix))

          return {
            'dcat:Dataset': {
              '@': { 'rdf:about': dataset.value },
              'dct:identifier': { '#': identifier },
              'dct:title': serializeTerm(dataset.out(ns.dcterms.title)),
              'dct:description': serializeTerm(dataset.out(ns.dcterms.description)),
              'dct:issued': serializeTerm(dataset.out(ns.dcterms.issued)),
              'dct:modified': serializeTerm(dataset.out(ns.dcterms.modified)),
              'dct:publisher': publishers,
              'dct:creator': serializeTerm(creators),
              'dcat:contactPoint': serializeTerm(dataset.out(ns.dcat.contactPoint)),
              'dcat:theme': serializeTerm(dataset.out(ns.dcat.theme)),
              'dct:language': serializeTerm(dataset.out(ns.dcterms.language)),
              'dct:relation': legalBasis,
              'dcat:keyword': serializeTerm(keywords),
              'dcat:landingPage': serializeTerm(dataset.out(ns.dcat.landingPage)),
              'dct:spatial': serializeTerm(dataset.out(ns.dcterms.spatial)),
              'dct:coverage': serializeTerm(dataset.out(ns.dcterms.coverage)),
              'dct:temporal': serializeTerm(dataset.out(ns.dcterms.temporal)),
              'dct:accrualPeriodicity': serializeTerm(accrualPeriodicity),
              'dcat:distribution': distributions,
            },
          }
        }).filter(Boolean),
      },
    },
  }).doc().end({ prettyPrint: true }).concat('\n')
}

function serializeTerm (pointer) {
  return pointer.map((value) => {
    if (isLiteral(value)) {
      return serializeLiteral(value)
    } else if (isNamedNode(value)) {
      return serializeNamedNode(value)
    } else if (isBlankNode(value)) {
      return serializeBlankNode(value)
    } else {
      return {}
    }
  })
}

function isLiteral (pointer) {
  return pointer.term.termType === 'Literal'
}

function isNamedNode (pointer) {
  return pointer.term.termType === 'NamedNode'
}

function isBlankNode (pointer) {
  return pointer.term.termType === 'BlankNode'
}

function serializeLiteral ({ term }) {
  const attrs = {}

  if (term.language) {
    attrs['xml:lang'] = term.language
  }

  if (term.datatype) {
    attrs['xml:datatype'] = term.datatype.value
  }

  return {
    '@': attrs,
    '#': term.value,
  }
}

function serializeNamedNode ({ value }) {
  return {
    '@': { 'rdf:resource': value },
  }
}

function serializeBlankNode (pointer) {
  const type = pointer.out(ns.rdf.type).value

  if (!type) return {}

  const properties = rdf.termSet([...pointer.dataset.match(pointer.term)]
    .map(({ predicate }) => predicate)
    .filter((term) => !term.equals(ns.rdf.type)))

  const resource = [...properties].reduce((acc, property) =>
    ({ ...acc, [shrink(property.value)]: serializeTerm(pointer.out(property)) }), {})

  return {
    [shrink(type)]: resource,
  }
}

function distributionFormatFromEncoding (encodingPointer) {
  const encoding = encodingPointer.values[0] || ''

  /* eslint-disable indent */
  switch (encoding) {
    case 'text/html': {
      return 'HTML'
    }
    case 'application/sparql-query': {
      return 'SERVICE'
    }
    default: {
      return 'UNKNOWN'
    }
  }
  /* eslint-enable indent */
}

export { toXML }
