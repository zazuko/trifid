import clownface from 'clownface'
import rdf from 'rdf-ext'
import { create as createXml } from 'xmlbuilder2'
import { shrink } from '@zazuko/rdf-vocabularies'
import TermSet from '@rdfjs/term-set'

import { fetchDatasets } from './query.js'
import * as ns from './namespace.js'

export async function getOrganizationDatasets(organizationGraph) {
  const quads = await fetchDatasets(organizationGraph)
  const pointer = clownface({ dataset: rdf.dataset(quads) })

  const datasetsPointer = pointer.node(ns.dcat.Dataset).in(ns.rdf.type)

  const xml = createXml({
    version: '1.0',
    encoding: 'utf-8',
    namespaceAlias: {
      rdf: ns.rdfURL,
      dcat: ns.dcatURL,
      dcterms: ns.dctermsURL,
    },
  }, {
    'rdf:RDF': {
      '@': {
        'xmlns:rdf': ns.rdfURL,
        'xmlns:dcat': ns.dcatURL,
        'xmlns:dcterms': ns.dctermsURL,
      },
      'dcat:Catalog': {
        'dcat:dataset': datasetsPointer.map((dataset) => ({
          'dcat:Dataset': {
            '@': { 'rdf:about': dataset.value },
            'dcterms:identifier': serializeTerm(dataset.out(ns.dcterms.identifier)),
            'dcterms:title': serializeTerm(dataset.out(ns.dcterms.title)),
            'dcterms:description': serializeTerm(dataset.out(ns.dcterms.description)),
            'dcterms:license': serializeTerm(dataset.out(ns.dcterms.license)),
            'dcterms:issued': serializeTerm(dataset.out(ns.dcterms.issued)),
            'dcterms:modified': serializeTerm(dataset.out(ns.dcterms.modified)),
            'dcterms:publisher': serializeTerm(dataset.out(ns.dcterms.publisher)),
            'dcterms:creator': serializeTerm(dataset.out(ns.dcterms.creator)),
            'dcat:contactPoint': serializeTerm(dataset.out(ns.dcat.contactPoint)),
            'dcat:theme': serializeTerm(dataset.out(ns.dcat.theme)),
            'dcterms:language': serializeTerm(dataset.out(ns.dcterms.language)),
            'dcterms:relation': serializeTerm(dataset.out(ns.dcterms.relation)),
            'dcat:keyword': serializeTerm(dataset.out(ns.dcat.keyword)),
            'dcat:landingPage': serializeTerm(dataset.out(ns.dcat.landingPage)),
            'dcterms:spacial': serializeTerm(dataset.out(ns.dcterms.spacial)),
            'dcterms:coverage': serializeTerm(dataset.out(ns.dcterms.coverage)),
            'dcterms:temporal': serializeTerm(dataset.out(ns.dcterms.temporal)),
            'dcat:distribution': serializeTerm(dataset.out(ns.dcterms.distribution)),
            'dcterms:accrualPeriodicity': serializeTerm(dataset.out(ns.dcterms.accrualPeriodicity)),
          },
        })),
      },
    },
  }).doc()

  return xml.end({ prettyPrint: true })
}

function serializeTerm(pointer) {
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

function isLiteral(pointer) {
  return pointer.term.termType === 'Literal'
}

function isNamedNode(pointer) {
  return pointer.term.termType === 'NamedNode'
}

function isBlankNode(pointer) {
  return pointer.term.termType === 'BlankNode'
}

function serializeLiteral({ term }) {
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

function serializeNamedNode({ value }) {
  return {
    '@': { 'rdf:resource': value },
  }
}

function serializeBlankNode(pointer) {
  const type = pointer.out(rdf.type).value

  if (!type) return {}

  const properties = new TermSet([...pointer.dataset.match(pointer.term)]
    .map(({ predicate }) => predicate)
    .filter((term) => !term.equals(rdf.type)))

  const resource = [...properties].reduce((acc, property) =>
    ({ ...acc, [shrink(property.value)]: serializeTerm(pointer.out(property)) }), {})

  return {
    [shrink(type)]: resource,
  }
}
