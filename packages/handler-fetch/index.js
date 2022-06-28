import formats from '@rdfjs/formats-common/index.js'
import path from 'path'
import rdf from 'rdf-ext'
import rdfHandler from '@rdfjs/express-handler'

import url from 'url'
import Fetcher from './lib/Fetcher.js'
import SerializerJsonld from '@rdfjs/serializer-jsonld-ext'

// @TODO discuss what are the best serialization options.
const jsonLdSerializer = new SerializerJsonld({
  encoding: 'string'
  // compact: true,
  // flatten: true
})

formats.serializers.set('application/json', jsonLdSerializer)
formats.serializers.set('application/ld+json', jsonLdSerializer)

const guessProtocol = (candidate) => {
  try {
    return new url.URL(candidate).protocol
  } catch (error) {
    return undefined
  }
}

export class FetchHandler {
  constructor (options) {
    this.dataset = rdf.dataset()
    this.url = options.url
    this.cache = options.cache
    this.contentType = options.contentType
    this.options = options.options || {}
    this.resource = options.resource
    this.split = options.split

    // add file:// and resolve with cwd if no protocol was given
    if (this.url && !guessProtocol(this.url)) {
      this.url = 'file://' + path.resolve(this.url)
    }

    this.handle = this._handle.bind(this)

    // legacy interface
    this.get = this._get.bind(this)
  }

  _handle (req, res, next) {
    rdfHandler.attach(req, res, { formats }).then(() => {
      return Fetcher.load(this.dataset, this)
    }).then(async () => {
      const dataset = this.dataset.match(null, null, null, rdf.namedNode(req.iri))

      if (dataset.size === 0) {
        next()
        return null
      }

      await res.dataset(dataset)
    }).catch(next)
  }

  // legacy interface
  _get (req, res, next, iri) {
    req.iri = iri

    this.handle(req, res, next)
  }
}

const factory = trifid => {
  const { config } = trifid

  const handler = new FetchHandler(config)

  return (req, res, next) => {
    handler.handle(req, res, next)
  }
}

export default factory
