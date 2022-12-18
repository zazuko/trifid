import { html } from 'lit'
import { renderTerm } from './N3Term.js'

function Debug (cf, options) {
  const list = []
  for (const quad of cf.dataset) {
    list.push(html`
        <tr>
            <td>${renderTerm(quad.subject)}</td>
            <td>${renderTerm(quad.predicate)}</td>
            <td>${renderTerm(quad.object)}</td>
        </tr>`)
  }

  return html`
      <table class="debug">
          ${list}
      </table>
  `
}

export { Debug }
