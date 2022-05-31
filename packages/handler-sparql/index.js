import debugLib from 'debug'
import nodeFetch from 'node-fetch'
import SparqlHttpClient from 'sparql-http-client'

const debug = debugLib('trifid:handler-sparql')
SparqlHttpClient.fetch = nodeFetch

const authBasicHeader = (user, password) => {
  return 'Basic ' + Buffer.from(user + ':' + password).toString('base64')
}

const handler = options => {
  const authentication = options.authentication || false
  const resourceNoSlash = options.resourceNoSlash || true
  const resourceExistsQuery = options.resourceExistsQuery || 'ASK { <${iri}> ?p ?o }' // eslint-disable-line no-template-curly-in-string
  const resourceGraphQuery = options.resourceGraphQuery || 'DESCRIBE <${iri}>' // eslint-disable-line no-template-curly-in-string
  const containerExistsQuery = options.containerExistsQuery || 'ASK { ?s a ?o. FILTER REGEX(STR(?s), "^${iri}") }' // eslint-disable-line no-template-curly-in-string
  const containerGraphQuery = options.containerGraphQuery || 'CONSTRUCT { ?s a ?o. } WHERE { ?s a ?o. FILTER REGEX(STR(?s), "^${iri}") }' // eslint-disable-line no-template-curly-in-string
  const client = new SparqlHttpClient({ endpointUrl: options.endpointUrl })

  const buildQueryOptions = () => {
    const queryOptions = {}

    if (authentication) {
      queryOptions.headers = {
        Authorization: authBasicHeader(authentication.user, authentication.password)
      }
    }

    return queryOptions
  }

  const buildResourceExistsQuery = iri => {
    return resourceExistsQuery.split('${iri}').join(iri) // eslint-disable-line no-template-curly-in-string
  }

  const buildResourceGraphQuery = iri => {
    return resourceGraphQuery.split('${iri}').join(iri) // eslint-disable-line no-template-curly-in-string
  }

  const buildContainerExistsQuery = iri => {
    return containerExistsQuery.split('${iri}').join(iri) // eslint-disable-line no-template-curly-in-string
  }

  const buildContainerGraphQuery = iri => {
    return containerGraphQuery.split('${iri}').join(iri) // eslint-disable-line no-template-curly-in-string
  }

  const exists = async (iri, query) => {
    debug('SPARQL exists query for IRI <' + iri + '> : ' + query)

    const res = await client.selectQuery(query, buildQueryOptions())
    const status = res.status
    if (status !== 200) {
      return { status, undefined }
    }
    const json = await res.json()
    const exists = json.boolean
    return { status, exists }
  }

  const graphStream = async (iri, query, accept) => {
    debug('SPARQL query for IRI <' + iri + '> : ' + query)

    const queryOptions = buildQueryOptions()

    queryOptions.accept = accept

    const res = await client.constructQuery(query, queryOptions)
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

  const get = async (req, res, next, iri) => {
    iri = encodeURI(iri)

    debug('handle GET request for IRI <' + iri + '>')

    const isContainer = resourceNoSlash && iri.endsWith('/')
    const queryExist = isContainer ? buildContainerExistsQuery(iri) : buildResourceExistsQuery(iri)

    const { status, isExisting } = await exists(iri, queryExist)

    if (status !== 200) {
      return res.status(status).send('')
    } else if (!isExisting) {
      return res.status(404).send('')
    } else {
      const query = isContainer ? buildContainerGraphQuery(iri) : buildResourceGraphQuery(iri)

      const { status, headers, stream } = await graphStream(iri, query, req.headers.accept)

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

  return (req, res, next) => {
    if (req.method === 'GET') {
      get(req, res, next, req.iri)
    } else {
      next()
    }
  }
}

const factory = trifid => {
  const { config } = trifid

  return handler(config)
}

export const SparqlHandler = handler
export default factory
