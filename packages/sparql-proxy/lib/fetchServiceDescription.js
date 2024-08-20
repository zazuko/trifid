import rdf from '@zazuko/env-node'

export default {
  fetchServiceDescription: async function fetchServiceDescription(endpointUrl, { format, authorization }) {
    const response = await rdf.fetch(endpointUrl, {
      headers: {
        Accept: format,
        authorization,
      },
    })
    return response.dataset()
  },
}
