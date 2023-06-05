import { ns } from '@zazuko/rdf-entity-webcomponent/src/namespaces.js'
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
  constructor(options) {
    const {
      endpointUrl,
      labelNamespace,
      labelNamespaces,
      chunkSize,
      concurrency,
      timeout,
      authentication,
      logger
    } = options
    if (!endpointUrl) {
      throw Error('requires a endpointUrl')
    }

    const clientOptions = {
      endpointUrl
    }
    if (authentication?.user) {
      clientOptions.user = authentication.user
    }
    if (authentication?.password) {
      clientOptions.password = authentication.password
    }

    this.client = new ParsingClient(clientOptions)
    this.labelNamespaces = labelNamespace ? [labelNamespace] : labelNamespaces
    this.chunkSize = chunkSize || 30
    this.queue = new PQueue({
      concurrency: concurrency || 2, timeout: timeout || 1000
    })
    this.logger = logger
  }

  labelFilter (pointer, term) {
    const inNamespaces = (term) => {
      if (!this.labelNamespaces || this.labelNamespaces.length === 0) {
        return true
      }
      for (const current of this.labelNamespaces) {
        if (term.value.startsWith(current)) {
          return true
        }
      }
      return false
    }

    if (term.termType === 'NamedNode') {
      if (inNamespaces(term)) {
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
    this.logger?.debug(`Fetching labels for terms without label: ${uris}`)
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
      if (chunk.length) {
        tasks.push(this.queue.add(() => this.fetchLabels(chunk)))
      }
    }
    return await Promise.all(tasks)
  }
}

export { LabelLoader }
