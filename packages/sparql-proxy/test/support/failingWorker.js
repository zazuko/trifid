import fsd from '../../lib/fetchServiceDescription.ts';

fsd.fetchServiceDescription = async (_endpointUrl, _opts) => {
  throw new Error('Failed to fetch service description');
};

import('../../lib/serviceDescriptionWorker.ts');
