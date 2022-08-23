import debugLib from 'debug'
import nodeFetch from 'node-fetch'
import SparqlHttpClient from 'sparql-http-client'

const debug = debugLib('trifid:handler-sparql')
SparqlHttpClient.fetch = nodeFetch

const defaults = {
  authentication: false,
  resourceNoSlash: true,
  resourceExistsQuery: 'ASK { <${iri}> ?p ?o }', // eslint-disable-line no-template-curly-in-string
  resourceGraphQuery: 'DESCRIBE <${iri}>', // eslint-disable-line no-template-curly-in-string
  containerExistsQuery: 'ASK { ?s a ?o. FILTER REGEX(STR(?s), "^${iri}") }', // eslint-disable-line no-template-curly-in-string
  containerGraphQuery: 'CONSTRUCT { ?s a ?o. } WHERE { ?s a ?o. FILTER REGEX(STR(?s), "^${iri}") }' // eslint-disable-line no-template-curly-in-string
}

const authBasicHeader = (user, password) => {
  return 'Basic ' + Buffer.from(user + ':' + password).toString('base64')
}

export class SparqlHandler {
  constructor(options) { // eslint-disable-line
    this.authentication = options.authentication
    this.resourceNoSlash = options.resourceNoSlash
    this.resourceExistsQuery = options.resourceExistsQuery
    this.resourceGraphQuery = options.resourceGraphQuery
    this.containerExistsQuery = options.containerExistsQuery
    this.containerGraphQuery = options.containerGraphQuery
    this.client = new SparqlHttpClient({ endpointUrl: options.endpointUrl })
  }

  buildQueryOptions () {
    const queryOptions = {}

    if (this.authentication) {
      queryOptions.headers = {
        Authorization: authBasicHeader(this.authentication.user, this.authentication.password)
      }
    }

    return queryOptions
  }

  buildResourceExistsQuery (iri) {
    return this.resourceExistsQuery.split('${iri}').join(iri) // eslint-disable-line no-template-curly-in-string
  }

  buildResourceGraphQuery (iri) {
    return this.resourceGraphQuery.split('${iri}').join(iri) // eslint-disable-line no-template-curly-in-string
  }

  buildContainerExistsQuery (iri) {
    return this.containerExistsQuery.split('${iri}').join(iri) // eslint-disable-line no-template-curly-in-string
  }

  buildContainerGraphQuery (iri) {
    return this.containerGraphQuery.split('${iri}').join(iri) // eslint-disable-line no-template-curly-in-string
  }

  async exists (iri, query) {
    debug('SPARQL exists query for IRI <' + iri + '> : ' + query)

    const res = await this.client.selectQuery(query, this.buildQueryOptions())
    const status = res.status
    if (status !== 200) {
      return { status, undefined }
    }
    const json = await res.json()
    const exists = json.boolean
    return { status, exists }
  }

  async graphStream (iri, query, accept) {
    debug('SPARQL query for IRI <' + iri + '> : ' + query)

    const queryOptions = this.buildQueryOptions()

    queryOptions.accept = accept

    const res = await this.client.constructQuery(query, queryOptions)
    if (res.status !== 200) {
      return { status: res.status }
    }
    const headers = {}

    res.headers.forEach((value, name) => {
      // stream will be decoded by the client -> remove content-encoding header
      if (name === 'content-encoding') {
        return
      }
      headers[name] = value
    })
    return {
      status: res.status,
      headers: headers,
      stream: res.body
    }
  }

  handle (req, res, next) {
    if (req.method === 'GET') {
      this.get(req, res, next, req.iri)
    } else {
      next()
    }
  }

  async get (req, res, next, iri) {
    iri = encodeURI(iri)

    debug('handle GET request for IRI <' + iri + '>')

    const isContainer = this.resourceNoSlash && iri.endsWith('/')
    const queryExist = isContainer ? this.buildContainerExistsQuery(iri) : this.buildResourceExistsQuery(iri)

    const { status, exists } = await this.exists(iri, queryExist)

    if (status !== 200) {
      return res.status(status).send('')
    } else if (!exists) {
      return res.status(404).send('')
    } else {
      const query = isContainer ? this.buildContainerGraphQuery(iri) : this.buildResourceGraphQuery(iri)

      const { status, headers, stream } = await this.graphStream(iri, query, req.headers.accept)

      if (!stream) {
        return next()
      }
      res.status(status)
      Object.keys(headers).forEach(name => {
        res.setHeader(name, headers[name])
      })
      stream.pipe(res)
    }
  }
}

export const factory = trifid => {
  const { config } = trifid

  const handler = new SparqlHandler({ ...defaults, ...config })

  return (req, res, next) => {
    handler.handle(req, res, next)
  }
}

export default factory
