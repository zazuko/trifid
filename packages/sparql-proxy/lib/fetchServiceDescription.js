import rdf from '@zazuko/env-node'

export default {
  fetchServiceDescription: async function fetchServiceDescription(endpointUrl, format) {
    const response = await rdf.fetch(endpointUrl, {
      headers: {
        Accept: format,
      },
    })
    return response.dataset()
  },
}
