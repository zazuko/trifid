import { splitIfVocab } from 'rdf-entity-webcomponent/src/builder/utils.js'

function shrink (urlStr) {
  const { vocab, value } = splitIfVocab(urlStr)
  return vocab ? `${vocab}:${value}` : `${value}`
}

export { shrink }
