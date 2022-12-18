import { html } from 'lit'
import { Metadata } from './Metadata.js'
import { Debug } from './Debug.js'
import { EntityList } from 'rdf-entity-webcomponent'

function TrifidResourceDescription (cf, options) {
  const debug = options.debug ? Debug(cf, options) : html``
  return html`
      <div>
          ${EntityList(cf, options)}
          ${Metadata(cf, options)}
          ${debug}
      </div>
  `
}

export { TrifidResourceDescription }
