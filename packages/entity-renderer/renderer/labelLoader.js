import { ns } from 'rdf-entity-webcomponent/src/namespaces.js'
import rdf from 'rdf-ext'
import PQueue from 'p-queue'
import ParsingClient from 'sparql-http-client/ParsingClient.js'

/**
 * endpointUrl: From where the labels are retrieved
 * labelNamespace: If specified, only fetches labels for iris starting with this
 * chunkSize: The number of labels to be fetched by each query
 * concurrency: Number of concurrent queries'
 * timeout: The timeout. Will return the successful chunks
 */

class LabelLoader {
  constructor (options) {
    const {
      endpointUrl, labelNamespace, chunkSize, concurrency, timeout
    } = options
    if (!endpointUrl) {
      throw Error('requires a endpointUrl')
    }
    this.client = new ParsingClient({ endpointUrl })
    // To filter by a namespace, for example 'https://ld.zazuko.com'
    this.labelNamespace = labelNamespace || endpointUrl.split(
      '/').splice(0, 3).join('/')
    this.chunkSize = chunkSize || 30
    this.queue = new PQueue({
      concurrency: concurrency || 2,
      timeout: timeout || 1000
    })
  }

  labelFilter (pointer, term) {
    if (term.termType === 'NamedNode') {
      if (term.value.startsWith(this.labelNamespace)) {
        const terms = pointer.node(term).out(ns.schema.name).terms
        return terms.length === 0
      }
    }
    return false
  }

  getTermsWithoutLabel (pointer) {
    const result = rdf.termSet()
    pointer.dataset.forEach(quad => {
      if (this.labelFilter(pointer, quad.subject)) {
        result.add(quad.subject)
      }
      if (this.labelFilter(pointer, quad.predicate)) {
        result.add(quad.predicate)
      }
      if (this.labelFilter(pointer, quad.object)) {
        result.add(quad.object)
      }
    })
    return result
  }

  async fetchLabels (iris) {
    const uris = iris.map(x => `<${x.value}> `).join(' ')
    return await this.client.query.construct(`
PREFIX schema: <http://schema.org/>

CONSTRUCT {
      graph ?g {
        ?uri schema:name ?label .
      }
    } where {
      graph ?g {
        ?uri schema:name ?label
        VALUES ?uri { ${uris} }
      }
}`)
  }

  async tryFetchAll (pointer) {
    const terms = [...this.getTermsWithoutLabel(pointer)]
    const tasks = []
    while (terms.length) {
      const chunk = terms.splice(0, this.chunkSize)
      tasks.push(this.queue.add(() => this.fetchLabels(chunk)))
    }
    return await Promise.all(tasks)
  }
}

export { LabelLoader }
