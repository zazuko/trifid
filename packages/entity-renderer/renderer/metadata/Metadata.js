import { html } from 'lit'
import rdf from 'rdf-ext'
import { renderTerm } from '../web-component/N3Term.js'
import { namedCounts } from './counts.js'

function Metadata (dataset, options) {
  const counts = options.showNamedGraphs
    ? namedCounts(dataset)
    : rdf.termMap()
  const list = []
  for (const [key, value] of counts.entries()) {
    list.push(html`
        <div class="metadata-row">
            <div>${renderTerm(key)}</div>
            <div>${renderTerm(value)} quads</div>
        </div>`)
  }

  if (options.metadata) {
    for (const [key, value] of Object.entries(options.metadata)) {
      list.push(html`
          <div class="metadata-row">
              <div>${renderTerm(key)}</div>
              <div>${renderTerm(value)}</div>
          </div>`)
    }
  }

  if (list.length) {
    return html`
        <div class="metadata">
            <div class="metadata-title">Metadata</div>
            <div class="metadata-table">
                ${list}
            </div>
        </div>
    `
  } else {
    return html``
  }
}

export { Metadata }
