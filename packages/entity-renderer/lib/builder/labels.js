import { ns } from '../namespaces.js'

function splitIfVocab (iri) {
  const candidates = Array.from(Object.entries(ns)).filter(([_, value]) => {
    return iri.startsWith(value().value)
  })
  if (candidates.length) {
    candidates.sort(([, iri1], [, iri2]) => iri2.length - iri1.length)
    const found = candidates[0]

    return {
      string: iri.replace(new RegExp(`^${found[1]().value}`), ''),
      vocab: found[0]
    }
  }

  const lastSegment = iri.split('/').pop()
  return {
    string: lastSegment
  }
}

function getWithLang (cf, options) {
  for (const lang of options.preferredLanguages) {
    const term = cf.out(options.labelProperties, { language: lang }).term
    if (term) {
      const language = term.language
      return {
        ...(language && { language }), string: term.value
      }
    }
  }
  return undefined
}

function getWithoutLang (cf, options) {
  const term = cf.out(options.labelProperties).term
  if (term) {
    const language = term.language
    return {
      ...(language && { language }), string: term.value
    }
  }
  return undefined
}

function getLabel (cf, options) {
  const term = cf.term

  if (term.termType === 'Literal') {
    const language = term.language
    const datatype = term.datatype ? splitIfVocab(term.datatype.value) : undefined
    return {
      ...(language && { language }), ...(datatype && { datatype }), string: term.value
    }
  }

  // Get the first label with language tag, using preferredLanguages
  const datasetLabelLang = options.preferredLanguages ? getWithLang(cf, options) : undefined
  if (datasetLabelLang) {
    return datasetLabelLang
  }

  const datasetLabel = getWithoutLang(cf, options)
  if (datasetLabel) {
    return datasetLabel
  }

  if (options.externalLabels) {
    const externalLabelLang = options.preferredLanguages ? getWithLang(options.externalLabels.node(term), options) : undefined
    if (externalLabelLang) {
      return externalLabelLang
    }
    const externalLabel = getWithoutLang(options.externalLabels.node(term), options)
    if (externalLabel) {
      return externalLabel
    }
  }

  return splitIfVocab(term.value)
}

export { getLabel }
