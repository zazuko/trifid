import { html } from 'lit'
import { EntityList } from '@zazuko/rdf-entity-webcomponent'
import { Debug } from './Debug.js'

function TrifidResourceDescription ({ dataset, term }, options) {
  const debug = options.debug ? Debug(dataset) : html``
  return html`
    <div>
      ${EntityList({ dataset, terms: term ? [term] : [] }, options)} ${debug}
    </div>
  `
}

export { TrifidResourceDescription }
