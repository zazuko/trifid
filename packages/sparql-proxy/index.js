import sparqlProxy from '@zazuko/sparql-proxy'

const factory = (trifid) => {
  const { config } = trifid
  return sparqlProxy(config)
}

export default factory
