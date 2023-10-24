import { getNamedGraphsCounts } from './metadata/namedGraphs.js'

const DEFAULTS = {
  showNamedGraphs: true,
}

function toBoolean (val) {
  if (val === 'false') {
    return false
  }
  if (val === 'true') {
    return true
  }
  return undefined
}

/**
 * Provides a JSON object with metadata to be exposed in the UI
 */
function createMetadataProvider ({ options = {} }) {
  return async (req, { dataset }) => {
    const metadataConfig = { ...DEFAULTS, ...options }

    if (req.query.showNamedGraphs !== undefined) {
      metadataConfig.showNamedGraphs = toBoolean(req.query.showNamedGraphs)
    }

    const metadata = {}

    if (metadataConfig.showNamedGraphs) {
      metadata.namedGraphs = getNamedGraphsCounts(dataset)
    }

    return metadata
  }
}

export { createMetadataProvider }
