import rdf from '@zazuko/env-node';

const fetchServiceDescription = async (
  endpointUrl: string,
  { headers, format }: { headers?: Record<string, string>; format?: string },
) => {
  const response = await rdf.fetch(endpointUrl, {
    headers: {
      ...headers,
      Accept: format || '*/*',
    },
  });
  return response.dataset();
};

export default { fetchServiceDescription };
