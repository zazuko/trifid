import { getNamedGraphsCounts } from './metadata/namedGraphs.ts';

const DEFAULTS = {
  showNamedGraphs: true,
};

function toBoolean(val: unknown) {
  if (val === 'false') {
    return false;
  }
  if (val === 'true') {
    return true;
  }
  return undefined;
}

/**
 * Provides a JSON object with metadata to be exposed in the UI
 */
function createMetadataProvider({ options = {} }: { options?: Record<string, any> }) {
  return async (req: any, { dataset }: { dataset: any }) => {
    const metadataConfig: Record<string, any> = { ...DEFAULTS, ...options };

    if (req.query.showNamedGraphs !== undefined) {
      metadataConfig.showNamedGraphs = toBoolean(req.query.showNamedGraphs);
    }

    const metadata: Record<string, any> = {};

    if (metadataConfig.showNamedGraphs) {
      metadata.namedGraphs = getNamedGraphsCounts(dataset);
    }

    return metadata;
  };
}

export { createMetadataProvider };
