import { html } from 'lit'
import { namedCounts } from '../model.js'

function maybeLink (key) {
  if (key.constructor.name === 'DefaultGraph') {
    return html`Default graph`
  }

  if (key.termType === 'Literal') {
    return html`${key.value}`
  }

  return key.termType === 'NamedNode'
    ? html`<a
          href="${key.value}">${key.value}</a>`
    : html`${key}`
}

function Debug (cf, options) {
  const list = []
  for (const quad of cf.dataset) {
    list.push(html`
        <tr>
            <td>${maybeLink(quad.subject)}</td>
            <td>${maybeLink(quad.predicate)}</td>
            <td>[${quad.object.termType}] ${maybeLink(quad.object)}</td>
        </tr>`)
  }

  return html`
      <table class="debug">
          ${list}
      </table>
  `
}

function Metadata (cf, options) {
  const counts = namedCounts(cf, options)
  const list = []
  for (const [key, value] of counts.entries()) {
    list.push(html`
        <tr>
            <td>${maybeLink(key)}</td>
            <td>${maybeLink(value)} quads</td>
        </tr>`)
  }

  if (options.metadata) {
    for (const [key, value] of Object.entries(options.metadata)) {
      list.push(html`
          <tr>
              <td>${maybeLink(key)}</td>
              <td>${maybeLink(value)}</td>
          </tr>`)
    }
  }

  return html`
      <div class="metadata">
          <h3>Metadata</h3>
          <table>
              ${list}
          </table>
      </div>
  `
}

export { Metadata, Debug }
