import hijackResponse from 'hijackresponse'
import rdfFormats from '@rdfjs/formats-common'
import { getMatchers } from './src/getMatchers.js'
import rdf from 'rdf-ext'
import SerializerJsonld from '@rdfjs/serializer-jsonld-ext'

const { parsers, serializers } = rdfFormats

// This is the same as rdf-handler-fetch
const jsonLdSerializer = new SerializerJsonld({
  encoding: 'string'
})

serializers.set('application/json', jsonLdSerializer)
serializers.set('application/ld+json', jsonLdSerializer)
parsers.set('application/json', parsers.get('application/ld+json'))

const factory = async (trifid) => {
  const { config } = trifid
  const matchers = getMatchers({ options: config })

  return async (req, res, next) => {
    hijackResponse(res, next).then(async ({ readable, writable }) => {
      const contentType = res.getHeader('Content-Type')
      if (!contentType) {
        return readable.pipe(writable)
      }

      const mimeType = contentType.toLowerCase().split(';')[0].trim()
      const hijackFormats = [
        'application/json',
        'application/ld+json',
        'application/trig',
        'application/n-quads',
        'application/n-triples',
        'text/n3',
        'text/turtle',
        'application/rdf+xml']
      if (!hijackFormats.includes(mimeType)) {
        return readable.pipe(writable)
      }

      const quadStream = await parsers.import(mimeType, readable)
      const dataset = await rdf.dataset().import(quadStream)
      const term = rdf.namedNode(req.iri)

      for (const matcher of matchers) {
        const handleMatch = matcher({ term, dataset })
        if (handleMatch) {
          handleMatch(req, res, next)
        }
      }
      const outputStream = serializers.import(mimeType, dataset.toStream())
      return outputStream.pipe(writable)
    })
  }
}

export default factory
