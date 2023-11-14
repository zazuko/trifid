import sparqlProxy from '@zazuko/sparql-proxy'
import { ProxyAgent } from 'proxy-agent'

const factory = (trifid) => {
  const { config } = trifid

  const {
    endpointUrl: _e, // ignore this field
    authentication: _a, // ignore this field
    enableProxy, // enable/disable the support for `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY` environment variables
    sparqlEndpoint, // get the configuration about the endpoint
    ...proxyConfig // rest of the configuration
  } = config

  if (sparqlEndpoint) {
    if (Object.hasOwnProperty.call(sparqlEndpoint, 'url')) {
      proxyConfig.endpointUrl = sparqlEndpoint.url
    }

    const hasProperties =
      Object.hasOwnProperty.call(sparqlEndpoint, 'username') &&
      Object.hasOwnProperty.call(sparqlEndpoint, 'password')
    if (
      hasProperties &&
      sparqlEndpoint.username !== '' &&
      sparqlEndpoint.password !== ''
    ) {
      proxyConfig.authentication = {
        user: sparqlEndpoint.username,
        password: sparqlEndpoint.password,
      }
    }
  }

  if (enableProxy && enableProxy !== 'false') {
    proxyConfig.agent = new ProxyAgent()
  }

  return sparqlProxy(proxyConfig)
}

export default factory
