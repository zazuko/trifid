import { render as renderWebComponent } from '@lit-labs/ssr/lib/render-with-global-dom-shim.js'
import { Parser } from 'n3'
import rdf from 'rdf-ext'
import jsonld from 'jsonld'
import { ResourceDescription } from '../lib/web-component/ResourceDescription.js'

const { toRDF } = jsonld
const parser = new Parser()

/**
 * Convert a string to quads.
 *
 * @param {string} str String to be parsed.
 * @returns Quads.
 */
const toQuads = (str) => {
  return parser.parse(str)
}

/**
 * Render HTML.
 *
 * @param {*} req Express request.
 * @param {*} graph Graph from a handler (JSON object).
 * @returns {Promise<string>} Rendered output as string.
 */
const renderer = async (req, graph) => {
  const iri = req.iri
  const term = rdf.namedNode(iri)
  const dataset = rdf.dataset()

  const nquads = await toRDF(graph, {
    format: 'application/n-quads'
  })

  dataset.addAll(toQuads(nquads))

  const cf = rdf.clownface({ dataset, term })

  const defaultLang = ['en', 'fr', 'de', 'it']
  const selectedLanguage = req.query.lang ? req.query.lang : 'en'
  const preferredLanguages = selectedLanguage ? [selectedLanguage, ...defaultLang] : defaultLang

  const rendererOptions = {
    preferredLanguages,
    technicalCues: true,
    compactMode: true,
    embedNamed: false,
    embedBlanks: true,
    // externalLabels: labels.cf,
    highLightLanguage: selectedLanguage
  }

  const resourceWebComponent = ResourceDescription(cf, rendererOptions)
  const stringIterator = renderWebComponent(resourceWebComponent)

  return Array.from(stringIterator).join('')
}

export default renderer
