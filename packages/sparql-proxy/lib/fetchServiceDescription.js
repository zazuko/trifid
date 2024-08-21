import rdf from '@zazuko/env-node'

const fetchServiceDescription = async (endpointUrl, { format, authorization }) => {
  const response = await rdf.fetch(endpointUrl, {
    headers: {
      Accept: format || '*/*',
      authorization,
    },
  })
  return response.dataset()
}

export default {
  fetchServiceDescription,
}
