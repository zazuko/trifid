import { render as renderWebComponent } from '@lit-labs/ssr/lib/render-with-global-dom-shim.js'
import { Parser } from 'n3'
import rdf from 'rdf-ext'

import { ResourceDescription } from './lib/web-component/ResourceDescription.js'

const parser = new Parser()

function toQuads (str) {
  return parser.parse(str)
}

class TrifidEntityRenderer {
  constructor (options) {
    this.rendererOptions = {
      embedNamed: false,
      embedBlanks: false,
      embedLists: true,
      groupValuesByProperty: options.compactMode,
      groupPropertiesByValue: options.compactMode
    }

    this.template = options.template
    this.templateError = options.templateError
  }

  render (req, res) {
    this.renderTemplate(this.template, req, res)
  }

  error (req, res) {
    res.locals.statusCode = res.statusCode
    if (this.templateError) {
      res.render(this.templateError)
    } else {
      console.log('Error template needs to be specified')
    }
  }

  async _render (template, req, res) {
    res.render(this.template)
  }

  renderTemplate (template, req, res) {
    const iri = req.iri

    res.locals.statusCode = res.statusCode

    const cf = rdf.clownface({ dataset: rdf.dataset().addAll(toQuads(res.locals.graph)), term: rdf.namedNode(iri) })

    const defaultLang = ['de', 'fr', 'it', 'en']
    const selectedLanguage = req.query.lang ? req.query.lang : 'de'
    const preferredLanguages = selectedLanguage ? [selectedLanguage, ...defaultLang] : defaultLang

    const rendererOptions = { ...this.rendererOptions, preferredLanguages, highLightLanguage: selectedLanguage }
    const resourceWebComponent = ResourceDescription(cf, rendererOptions)
    const stringIterator = renderWebComponent(resourceWebComponent)

    res.locals.resourceDescription = Array.from(stringIterator).join('\n')

    this._render(this.template, req, res)
  }
}

export default TrifidEntityRenderer
