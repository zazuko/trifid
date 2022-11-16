import {
  render as renderWebComponent
} from '@lit-labs/ssr/lib/render-with-global-dom-shim.js'
import rdf from 'rdf-ext'
import {
  ResourceDescription
} from '../lib/web-component/ResourceDescription.js'

const DEFAULTS = {
  compactMode: true,
  embedBlanks: true,
  technicalCues: true,
  preferredLanguages: ['en', 'fr', 'de', 'it'],
  highLightLanguage: 'en',
  embedNamed: false,
  embedLists: true,
  debug: false,
  maxLevel: 3 // externalLabels: labels.cf,
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

function createRenderer ({ options = {} }) {
  return async (req, { dataset }) => {
    const rendererConfig = Object.assign({}, DEFAULTS, options)

    // Honor parameters in the request

    if (req.query.compactMode !== undefined) {
      rendererConfig.compactMode = toBoolean(req.query.compactMode)
    }

    if (req.query.technicalCues !== undefined) {
      rendererConfig.technicalCues = toBoolean(req.query.technicalCues)
    }

    if (req.query.embedNamed !== undefined) {
      rendererConfig.embedNamed = toBoolean(req.query.embedNamed)
    }

    if (req.query.embedBlanks !== undefined) {
      rendererConfig.embedBlanks = toBoolean(req.query.embedBlanks)
    }

    if (req.query.embedLists !== undefined) {
      rendererConfig.embedLists = toBoolean(req.query.embedLists)
    }

    if (req.query.maxLevel !== undefined) {
      rendererConfig.maxLevel = parseInt(req.query.maxLevel)
    }

    if (req.query.debug !== undefined) {
      rendererConfig.debug = toBoolean(req.query.debug)
    }

    if (req.query.lang) {
      rendererConfig.preferredLanguages = [
        req.query.lang, ...DEFAULTS.preferredLanguages]
    }

    if (req.query.highLightLanguage !== undefined) {
      rendererConfig.highLightLanguage = req.query.highLightLanguage
    }

    if (!rendererConfig.highLightLanguage) {
      rendererConfig.highLightLanguage = rendererConfig.preferredLanguages[0]
    }

    if (rendererConfig.compactMode) {
      rendererConfig.groupValuesByProperty = rendererConfig.compactMode
      rendererConfig.groupPropertiesByValue = rendererConfig.compactMode
    }

    const iri = req.iri
    const term = rdf.namedNode(iri)

    const cf = rdf.clownface({ dataset, term })

    const resourceWebComponent = ResourceDescription(cf, rendererConfig)
    const stringIterator = renderWebComponent(resourceWebComponent)

    return Array.from(stringIterator).join('')
  }
}

export { createRenderer }
