import { splitIfVocab } from 'rdf-entity-webcomponent/src/builder/utils.js'

function shrink (urlStr) {
  const { vocab, string } = splitIfVocab(urlStr)
  return vocab ? `${vocab}:${string}` : `${string}`
}

export { shrink }
