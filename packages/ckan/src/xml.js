import rdf from '@zazuko/env'
import * as ns from './namespace.js'
import prefixes, { shrink } from '@zazuko/prefixes'
import { create as createXml } from 'xmlbuilder2'

function toXML (dataset) {
  const pointer = rdf.clownface({ dataset: rdf.dataset(dataset) })
  const datasetsPointer = pointer.node(ns.dcat.Dataset).in(ns.rdf.type)

  const pf = Object.entries(prefixes)
    // `xml` prefix is reserved and must not be re-declared
    .filter(([prefix]) => prefix !== 'xml')
    .reduce((acc, [prefix, url]) => ({ ...acc, [`xmlns:${prefix}`]: url }), {})

  return createXml({
    version: '1.0',
    encoding: 'utf-8',
    namespaceAlias: {
      rdf: prefixes.rdf,
      dcat: prefixes.dcat,
      dcterms: prefixes.dcterms,
      vcard: prefixes.vcard
    }
  }, {
    'rdf:RDF': {
      '@': pf,
      'dcat:Catalog': {
        'dcat:dataset': datasetsPointer.map((dataset) => {
          // Verify that identifiers is CKAN-valid, ignore the dataset otherwise
          const identifiers = dataset.out(ns.dcterms.identifier)
          if (!identifiers.value) {
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
                  'rdfs:label': 'legal_basis'
                }
              }
            : null

          const distributions = dataset.out(ns.schema.workExample)
            .filter(workExample => workExample.out(ns.schema.encodingFormat).terms.length > 0)
            .map(workExample => ({
              'dcat:Distribution': {
                'dcterms:issued': serializeTerm(dataset.out(ns.dcterms.issued)),
                'dcat:mediaType': serializeTerm(workExample.out(ns.schema.encodingFormat)),
                'dcat:accessURL': serializeTerm(workExample.out(ns.schema.url)),
                'dcterms:title': serializeTerm(workExample.out(ns.schema.name)),
                'dcterms:rights': serializeTerm(copyright),
                'dcterms:format': { '#': distributionFormatFromEncoding(workExample.out(ns.schema.encodingFormat)) }
              }
            }))

          const publishers = dataset.out(ns.dcterms.publisher)
            .map(publisher => ({
              'rdf:Description': {
                'rdfs:label': publisher.value
              }
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
              'dcterms:identifier': { '#': identifier },
              'dcterms:title': serializeTerm(dataset.out(ns.dcterms.title)),
              'dcterms:description': serializeTerm(dataset.out(ns.dcterms.description)),
              'dcterms:issued': serializeTerm(dataset.out(ns.dcterms.issued)),
              'dcterms:modified': serializeTerm(dataset.out(ns.dcterms.modified)),
              'dcterms:publisher': publishers,
              'dcterms:creator': serializeTerm(creators),
              'dcat:contactPoint': serializeTerm(dataset.out(ns.dcat.contactPoint)),
              'dcat:theme': serializeTerm(dataset.out(ns.dcat.theme)),
              'dcterms:language': serializeTerm(dataset.out(ns.dcterms.language)),
              'dcterms:relation': legalBasis,
              'dcat:keyword': serializeTerm(keywords),
              'dcat:landingPage': serializeTerm(dataset.out(ns.dcat.landingPage)),
              'dcterms:spatial': serializeTerm(dataset.out(ns.dcterms.spatial)),
              'dcterms:coverage': serializeTerm(dataset.out(ns.dcterms.coverage)),
              'dcterms:temporal': serializeTerm(dataset.out(ns.dcterms.temporal)),
              'dcterms:accrualPeriodicity': serializeTerm(accrualPeriodicity),
              'dcat:distribution': distributions
            }
          }
        }).filter(Boolean)
      }
    }
  }).doc().end({ prettyPrint: true })
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
    '#': term.value
  }
}

function serializeNamedNode ({ value }) {
  return {
    '@': { 'rdf:resource': value }
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
    [shrink(type)]: resource
  }
}

function distributionFormatFromEncoding (encodingPointer) {
  const encoding = encodingPointer.values[0] || ''

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
}

export { toXML }
