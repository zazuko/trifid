import toNT from '@rdfjs/to-ntriples'
import { html } from 'lit'
import { shrink } from '@zazuko/prefixes'

function renderTerm (term) {
  if (term.termType === 'NamedNode') {
    return html`<a href="${term.value}">${shrink(term.value) || term.value}</a>`
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

export { renderTerm, shrink }
