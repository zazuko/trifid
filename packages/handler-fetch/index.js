import formats from '@rdfjs/formats-common/index.js'
import path from 'path'
import rdf from 'rdf-ext'
import rdfHandler from '@rdfjs/express-handler'

import url from 'url'
import Fetcher from './lib/Fetcher.js'
import SerializerJsonld from '@rdfjs/serializer-jsonld-ext'

const jsonLdSerializer = new SerializerJsonld({
  encoding: 'string',
  compact: true,
  flatten: true
})

formats.serializers.set('application/json', jsonLdSerializer)
formats.serializers.set('application/ld+json', jsonLdSerializer)

class FetchHandler {
  constructor (options) {
    this.dataset = rdf.dataset()
    this.url = options.url
    this.cache = options.cache
    this.contentType = options.contentType
    this.options = options.options || {}
    this.resource = options.resource
    this.split = options.split

    // add file:// and resolve with cwd if no protocol was given
    if (this.url && !url.parse(this.url).protocol) {
      this.url = 'file://' + path.resolve(this.url)
    }

    this.handle = this._handle.bind(this)

    // legacy interface
    this.get = this._get.bind(this)
  }

  _handle (req, res, next) {
    rdfHandler.attach(req, res, { formats: formats }).then(() => {
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

export default FetchHandler
