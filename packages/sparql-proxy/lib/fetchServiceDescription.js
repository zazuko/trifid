import rdf from '@zazuko/env-node'

const fetchServiceDescription = async (endpointUrl, { headers, format }) => {
  const response = await rdf.fetch(endpointUrl, {
    headers: {
      ...headers,
      Accept: format || '*/*',
    },
  })
  return response.dataset()
}

export default { fetchServiceDescription }
