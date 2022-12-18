import { html } from 'lit'
import { namedCounts } from './counts.js'
import { renderTerm } from './N3Term.js'
import rdf from 'rdf-ext'

function Metadata (cf, options) {
  const counts = options.showNamedGraphs
    ? namedCounts(cf, options)
    : rdf.termMap()
  const list = []
  for (const [key, value] of counts.entries()) {
    list.push(html`
        <tr>
            <td>${renderTerm(key)}</td>
            <td>${renderTerm(value)} quads</td>
        </tr>`)
  }

  if (options.metadata) {
    for (const [key, value] of Object.entries(options.metadata)) {
      list.push(html`
          <tr>
              <td>${renderTerm(key)}</td>
              <td>${renderTerm(value)}</td>
          </tr>`)
    }
  }

  if (list.length) {
    return html`
        <div class="metadata">
            <h3>Metadata</h3>
            <table>
                ${list}
            </table>
        </div>
    `
  } else {
    return html``
  }
}

export { Metadata }
