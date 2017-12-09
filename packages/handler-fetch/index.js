const fileFetch = require('file-fetch')
const formats = require('rdf-formats-common')()
const nodeifyFetch = require('nodeify-fetch')
const protoFetch = require('proto-fetch')
const rdf = require('rdf-ext')
const rdfBodyParser = require('rdf-body-parser')
const rdfFetch = require('rdf-fetch')
const resourcesToGraph = require('rdf-utils-dataset/resourcesToGraph')
const JsonLdSerializer = require('rdf-serializer-jsonld-ext')

const fetch = protoFetch({
  file: fileFetch,
  http: nodeifyFetch,
  https: nodeifyFetch
})

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
    this.url = options.url
    this.options = options.options || {}
    this.options.fetch = fetch
    this.cache = options.cache
    this.contentType = options.contentType
    this.split = options.split

    this.handle = this._handle.bind(this)

    // legacy interface
    this.get = this._get.bind(this)
  }

  _handle (req, res, next) {
    rdfBodyParser.attach(req, res, {formats: formats}).then(() => {
      return this.load()
    }).then(() => {
      const dataset = this.dataset.match(null, null, null, rdf.namedNode(req.iri))

      if (dataset.length === 0) {
        return next()
      }

      const graph = rdf.graph(dataset)

      res.graph(graph)
    }).catch(next)
  }

  // legacy interface
  _get (req, res, next, iri) {
    req.iri = iri

    this.handle(req, res, next)
  }

  load () {
    if (this.cache && this.dataset) {
      return Promise.resolve()
    }

    return rdfFetch(this.url, this.options).then((res) => {
      if (this.contentType) {
        res.headers.set('content-type', this.contentType)
      }

      return res
    }).then(res => res.dataset()).then((input) => {
      if (this.split) {
        this.dataset = resourcesToGraph(input)
      } else {
        this.dataset = input
      }
    })
  }
}

module.exports = FetchHandler
