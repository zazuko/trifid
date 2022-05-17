import fileFetch from 'file-fetch'
import protoFetch from 'proto-fetch'
import rdf from 'rdf-ext'
import rdfFetch from 'rdf-fetch'
import splitIntoGraphs from './spread/splitIntoGraphs.js'

const fetch = protoFetch({
  file: fileFetch,
  http: rdf.fetch,
  https: rdf.fetch
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

  static spreadDataset (inputDataset, outputDataset, options) {
    if (options.resource) {
      outputDataset.addAll(rdf.dataset(inputDataset, rdf.namedNode(options.resource)))
    } else if (options.split) {
      outputDataset.addAll(splitIntoGraphs(inputDataset))
    } else {
      outputDataset.addAll(inputDataset)
    }

    options.resources = Object.keys([...outputDataset].reduce((resources, quad) => {
      resources[quad.graph.value] = true

      return resources
    }, {}))

    return outputDataset
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
