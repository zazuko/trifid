// @ts-check
import rdf from '@zazuko/env'
import prefixes, { shrink } from '@zazuko/prefixes'
import { create as createXml } from 'xmlbuilder2'
import * as ns from './namespace.js'

/**
 * Generate a CKAN-compatible XML representation of the dataset.
 *
 * @param {any[]} dataset Dataset to convert.
 * @returns {string} XML representation of the dataset.
 */
const toXML = (dataset) => {
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
          // @ts-ignore
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
                'dcterms:issued': serializeTerm(dataset.out(ns.dcterms.issued)),
                'dcat:mediaType': serializeTerm(workExample.out(ns.schema.encodingFormat)),
                'dcat:accessURL': serializeTerm(workExample.out(ns.schema.url)),
                'dcterms:title': serializeTerm(workExample.out(ns.schema.name)),
                'dcterms:rights': serializeTerm(copyright),
                'dcterms:format': { '#': distributionFormatFromEncoding(workExample.out(ns.schema.encodingFormat)) },
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
            .map((t) => {
              if (!t.term || !t.term.value) {
                return t
              }
              // If the frequency is not a EU frequency, it is returned unchanged.
              t.term.value = convertEUFrequencyToLegacy(t.term.value)
              return t
            })
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
              'dcat:distribution': distributions,
            },
          }
        }).filter(Boolean),
      },
    },
  }).doc().end({ prettyPrint: true }).concat('\n')
}

const serializeTerm = (pointer) => {
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

const isLiteral = (pointer) => {
  return pointer.term.termType === 'Literal'
}

const isNamedNode = (pointer) => {
  return pointer.term.termType === 'NamedNode'
}

const isBlankNode = (pointer) => {
  return pointer.term.termType === 'BlankNode'
}

const serializeLiteral = ({ term }) => {
  const attrs = {}

  if (term.language) {
    attrs['xml:lang'] = term.language
  }

  if (term.datatype) {
    attrs['rdf:datatype'] = term.datatype.value
  }

  return {
    '@': attrs,
    '#': term.value,
  }
}

const serializeNamedNode = ({ value }) => {
  return {
    '@': { 'rdf:resource': value },
  }
}

const serializeBlankNode = (pointer) => {
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

const distributionFormatFromEncoding = (encodingPointer) => {
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

/**
 * Convert EU frequency to legacy frequency if possible.
 * If the frequency is not a EU frequency, it is returned unchanged.
 * If there is no mapping for the EU frequency, it is returned unchanged.
 *
 * @param {string} frequency Frequency to convert.
 * @returns {string} Converted frequency.
 */
const convertEUFrequencyToLegacy = (frequency) => {
  const legacyFreqPrefix = 'http://purl.org/cld/freq'
  const euFreqPrefix = 'http://publications.europa.eu/resource/authority/frequency'
  switch (frequency) {
    case `${euFreqPrefix}/ANNUAL`:
      return `${legacyFreqPrefix}/annual`
    case `${euFreqPrefix}/ANNUAL_2`:
      return `${legacyFreqPrefix}/semiannual`
    case `${euFreqPrefix}/ANNUAL_3`:
      return `${legacyFreqPrefix}/threeTimesAYear`
    case `${euFreqPrefix}/BIENNIAL`:
      return `${legacyFreqPrefix}/biennial`
    case `${euFreqPrefix}/BIMONTHLY`:
      return `${legacyFreqPrefix}/bimonthly`
    case `${euFreqPrefix}/BIWEEKLY`:
      return `${legacyFreqPrefix}/biweekly`
    case `${euFreqPrefix}/CONT`:
      return `${legacyFreqPrefix}/continuous`
    case `${euFreqPrefix}/DAILY`:
      return `${legacyFreqPrefix}/daily`
    case `${euFreqPrefix}/IRREG`:
      return `${legacyFreqPrefix}/irregular`
    case `${euFreqPrefix}/MONTHLY`:
      return `${legacyFreqPrefix}/monthly`
    case `${euFreqPrefix}/MONTHLY_2`:
      return `${legacyFreqPrefix}/semimonthly`
    case `${euFreqPrefix}/MONTHLY_3`:
      return `${legacyFreqPrefix}/threeTimesAMonth`
    case `${euFreqPrefix}/QUARTERLY`:
      return `${legacyFreqPrefix}/quarterly`
    case `${euFreqPrefix}/TRIENNIAL`:
      return `${legacyFreqPrefix}/triennial`
    case `${euFreqPrefix}/WEEKLY`:
      return `${legacyFreqPrefix}/weekly`
    case `${euFreqPrefix}/WEEKLY_2`:
      return `${legacyFreqPrefix}/semiweekly`
    case `${euFreqPrefix}/WEEKLY_3`:
      return `${legacyFreqPrefix}/threeTimesAWeek`
  }
  return frequency
}

export { toXML }
