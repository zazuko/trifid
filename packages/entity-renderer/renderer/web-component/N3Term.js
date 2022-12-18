import { html } from 'lit'
import toNT from '@rdfjs/to-ntriples'
import { splitIfVocab } from 'rdf-entity-webcomponent/src/builder/utils.js'

function shrink (urlStr) {
  const { vocab, string } = splitIfVocab(urlStr)
  return vocab ? `${vocab}:${string}` : `${string}`
}

function renderTerm (term) {
  if (term.termType === 'NamedNode') {
    return html`<a href="${term.value}">${shrink(term.value)}</a>`
  }
  if (term.constructor.name === 'DefaultGraph') {
    return html`Default graph`
  }
  if (term.termType) {
    return html`${toNT(term)}`
  }
  if (term.value) {
    return html`${term.value}`
  }
  return html`${term}`
}

export { renderTerm }
