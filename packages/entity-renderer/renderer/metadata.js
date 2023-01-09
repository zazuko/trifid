import {
  render as renderWebComponent
} from '@lit-labs/ssr/lib/render-with-global-dom-shim.js'
import rdf from 'rdf-ext'
import { Metadata } from './metadata/Metadata.js'

const DEFAULTS = {
  showNamedGraphs: true
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
 * Render HTML.
 *
 * @param {*} req Express request.
 * @param {*} graph Graph from a handler (JSON object).
 * @returns {function(*, *): Promise<string>} Rendered output as string.
 */
function createMetadataRenderer ({ options = {} }) {
  return async (req, { dataset }) => {
    const metadataConfig = { ...DEFAULTS, ...options }

    if (req.query.showNamedGraphs !== undefined) {
      metadataConfig.showNamedGraphs = toBoolean(req.query.showNamedGraphs)
    }

    metadataConfig.metadata = {}

    // Add endpoint to the metadata
    if (metadataConfig.labelLoader) {
      const endpoint = metadataConfig.labelLoader.endpointUrl || '/query'
      const endpointUrl = new URL(endpoint, req.absoluteUrl())
      metadataConfig.metadata['SPARQL endpoint:'] = rdf.namedNode(
        `${endpointUrl}`)
    }

    const metadata = Metadata(dataset, metadataConfig)
    const stringIterator = renderWebComponent(metadata)

    return Array.from(stringIterator).join('')
  }
}

export { createMetadataRenderer }
