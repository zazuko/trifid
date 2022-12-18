import { html } from 'lit'
import { Metadata } from './Metadata.js'
import { Debug } from './Debug.js'
import { EntityList } from 'rdf-entity-webcomponent'

function TrifidResourceDescription ({ dataset, term }, options) {
  const debug = options.debug ? Debug(dataset) : html``
  return html`
      <div>
          ${EntityList({ dataset, terms: [term] }, options)}
          ${Metadata(dataset, options)}
          ${debug}
      </div>
  `
}

export { TrifidResourceDescription }
