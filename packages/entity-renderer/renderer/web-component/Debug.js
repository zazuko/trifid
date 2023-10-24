import { html } from 'lit'
import { renderTerm } from './N3Term.js'

function Debug (dataset) {
  const list = []
  for (const quad of dataset) {
    list.push(
      html` <tr>
        <td>${renderTerm(quad.subject)}</td>
        <td>${renderTerm(quad.predicate)}</td>
        <td>${renderTerm(quad.object)}</td>
      </tr>`,
    )
  }

  return html`
    <table class="debug">
      ${list}
    </table>
  `
}

export { Debug }
