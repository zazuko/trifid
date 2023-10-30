import debugLib from 'debug'
import ParsingClient from 'sparql-http-client/ParsingClient.js'
import SimpleClient from 'sparql-http-client/SimpleClient.js'

const debug = debugLib('trifid:handler-sparql')

const defaults = {
  authentication: false,
  resourceNoSlash: true,
  resourceExistsQuery: 'ASK { <${iri}> ?p ?o }', // eslint-disable-line no-template-curly-in-string
  resourceGraphQuery: 'DESCRIBE <${iri}>', // eslint-disable-line no-template-curly-in-string
  containerExistsQuery: 'ASK { ?s a ?o. FILTER REGEX(STR(?s), "^${iri}") }', // eslint-disable-line no-template-curly-in-string
  containerGraphQuery:
    'CONSTRUCT { ?s a ?o. } WHERE { ?s a ?o. FILTER REGEX(STR(?s), "^${iri}") }', // eslint-disable-line no-template-curly-in-string
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
    this.parsingClient = new ParsingClient({
      endpointUrl: options.endpointUrl,
    })
    this.simpleClient = new SimpleClient({ endpointUrl: options.endpointUrl })
  }

  buildQueryOptions() {
    const queryOptions = {}

    if (
      this.authentication &&
      this.authentication.user &&
      this.authentication.password
    ) {
      queryOptions.headers = {
        Authorization: authBasicHeader(
          this.authentication.user,
          this.authentication.password,
        ),
      }
    }

    return queryOptions
  }

  buildResourceExistsQuery(iri) {
    return this.resourceExistsQuery.split('${iri}').join(iri) // eslint-disable-line no-template-curly-in-string
  }

  buildResourceGraphQuery(iri) {
    return this.resourceGraphQuery.split('${iri}').join(iri) // eslint-disable-line no-template-curly-in-string
  }

  buildContainerExistsQuery(iri) {
    return this.containerExistsQuery.split('${iri}').join(iri) // eslint-disable-line no-template-curly-in-string
  }

  buildContainerGraphQuery(iri) {
    return this.containerGraphQuery.split('${iri}').join(iri) // eslint-disable-line no-template-curly-in-string
  }

  async exists(iri, query) {
    debug('SPARQL exists query for IRI <' + iri + '> : ' + query)

    try {
      const exists = await this.parsingClient.query.ask(
        query,
        this.buildQueryOptions(),
      )
      return { exists, status: 200 }
    } catch (error) {
      return { status: error.status }
    }
  }

  async graphStream(iri, query, accept) {
    debug('SPARQL query for IRI <' + iri + '> : ' + query)

    const headers = this.buildQueryOptions()
    headers.accept = accept

    const res = await this.simpleClient.query.construct(query, { headers })
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
      stream: res.body,
    }
  }

  handle(req, res, next) {
    switch (req.method) {
    case 'HEAD':
      return this.head(req, res, next, req.iri)
    case 'GET':
      return this.get(req, res, next, req.iri)
    }

    return next()
  }

  async head(_req, res, next, iri) {
    iri = encodeURI(iri)

    debug('handle HEAD request for IRI <' + iri + '>')

    const isContainer = this.resourceNoSlash && iri.endsWith('/')
    const queryExist = isContainer
      ? this.buildContainerExistsQuery(iri)
      : this.buildResourceExistsQuery(iri)

    const { status, exists } = await this.exists(iri, queryExist)

    if (status !== 200) {
      res.sendStatus(status)
      return next()
    } else if (!exists) {
      return next()
    }

    res.sendStatus(status)
  }

  async get(req, res, next, iri) {
    iri = encodeURI(iri)

    debug('handle GET request for IRI <' + iri + '>')

    const isContainer = this.resourceNoSlash && iri.endsWith('/')
    const queryExist = isContainer
      ? this.buildContainerExistsQuery(iri)
      : this.buildResourceExistsQuery(iri)

    const { status, exists } = await this.exists(iri, queryExist)

    if (status !== 200) {
      res.sendStatus(status)
      return next()
    } else if (!exists) {
      return next()
    } else {
      const query = isContainer
        ? this.buildContainerGraphQuery(iri)
        : this.buildResourceGraphQuery(iri)

      const { status, headers, stream } = await this.graphStream(
        iri,
        query,
        req.headers.accept,
      )

      if (!stream) {
        return next()
      }
      res.status(status)
      Object.keys(headers).forEach((name) => {
        res.setHeader(name, headers[name])
      })
      stream.pipe(res)
    }
  }
}

export const factory = (trifid) => {
  const { config } = trifid
  const { endpointUrl } = config

  const endpoint = endpointUrl || '/query'

  return (req, res, next) => {
    const absoluteUrl =
      res.locals.camouflageRewriteOriginalUrl || req.absoluteUrl()
    const endpointUrl = new URL(endpoint, absoluteUrl)
    const handler = new SparqlHandler({
      ...defaults,
      ...config,
      endpointUrl: endpointUrl.toString(),
    })
    handler.handle(req, res, next)
  }
}

export default factory
