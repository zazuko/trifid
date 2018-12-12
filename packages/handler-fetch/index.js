const formats = require('rdf-formats-common')()
const path = require('path')
const rdf = require('rdf-ext')
const rdfBodyParser = require('rdf-body-parser')
const url = require('url')
const Fetcher = require('./lib/Fetcher')
const JsonLdSerializer = require('rdf-serializer-jsonld-ext')

const jsonLdSerializer = new JsonLdSerializer({
  process: [
    {flatten: true},
    {compact: true},
    {outputFormat: 'string'}
  ]
})

formats.serializers['application/json'] = jsonLdSerializer
formats.serializers['application/ld+json'] = jsonLdSerializer

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
    rdfBodyParser.attach(req, res, {formats: formats}).then(() => {
      return Fetcher.load(this.dataset, this)
    }).then(() => {
      const dataset = this.dataset.match(null, null, null, rdf.namedNode(req.iri))

      if (dataset.length === 0) {
        next()
        return null
      }

      const graph = rdf.graph(dataset)

      return res.graph(graph)
    }).catch(next)
  }

  // legacy interface
  _get (req, res, next, iri) {
    req.iri = iri

    this.handle(req, res, next)
  }
}

module.exports = FetchHandler
