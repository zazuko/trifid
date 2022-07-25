import { html } from 'lit'
import { namedCounts } from '../model.js'

function NamedGraphSummary (cf, options) {
  const counts = namedCounts(cf, options)
  const list = []
  for (const [key, value] of counts.entries()) {
    list.push(html`
        <li><a href="${key.value}">${key.value}</a> ${value} quads</li>`)
  }
  return html`
      <div class="named-graphs">
          <ul>
              <h3>Data</h3>
              ${list}
          </ul>
      </div>
  `
}

export { NamedGraphSummary }
