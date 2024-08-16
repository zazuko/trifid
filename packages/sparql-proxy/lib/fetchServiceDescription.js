import rdf from '@zazuko/env-node'

export default {
  fetchServiceDescription: async function fetchServiceDescription(endpointUrl) {
    const response = await rdf.fetch(endpointUrl)
    return response.dataset()
  },
}
