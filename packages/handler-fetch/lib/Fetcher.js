import fileFetch from 'file-fetch'
import nodeifyFetch from 'nodeify-fetch'
import protoFetch from 'proto-fetch'
import rdf from 'rdf-ext'
import rdfFetch from 'rdf-fetch'
import resourcesToGraph from 'rdf-utils-dataset/resourcesToGraph.js'

const fetch = protoFetch({
  file: fileFetch,
  http: nodeifyFetch,
  https: nodeifyFetch
})

class Fetcher {
  static isCached (options) {
    return options.cache && options.fetched
  }

  static clearDataset (dataset, options) {
    if (!options.resources) {
      return
    }

    options.resources.forEach((resource) => {
      dataset.deleteMatches(null, null, null, rdf.namedNode(resource))
    })
  }

  static fetchDataset (options) {
    options.options = options.options || {}
    options.options.fetch = fetch

    return rdfFetch(options.url, options.options).then((res) => {
      if (options.contentType) {
        res.headers.set('content-type', options.contentType)
      }
      options.fetched = new Date()

      return res.dataset()
    })
  }

  static spreadDataset (input, output, options) {
    if (options.resource) {
      output.addAll(rdf.dataset(input, rdf.namedNode(options.resource)))
    } else if (options.split) {
      output.addAll(resourcesToGraph(input))
    } else {
      output.addAll(input)
    }

    options.resources = Object.keys([...output].reduce((resources, quad) => {
      resources[quad.graph.value] = true

      return resources
    }, {}))

    return output
  }

  static load (dataset, options) {
    if (Fetcher.isCached(options)) {
      return Promise.resolve()
    }

    Fetcher.clearDataset(dataset, options)

    return Fetcher.fetchDataset(options).then((input) => {
      return Fetcher.spreadDataset(input, dataset, options)
    })
  }
}

export default Fetcher
