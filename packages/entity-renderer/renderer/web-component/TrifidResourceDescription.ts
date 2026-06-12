import { html } from 'lit';
import { EntityList } from '@zazuko/rdf-entity-webcomponent';
import { Debug } from './Debug.ts';

function TrifidResourceDescription({ dataset, term }: any, options: any) {
  const debug = options.debug ? Debug(dataset) : html``;
  return html`
    <div>
      ${EntityList({ dataset, terms: term ? [term] : [] }, options)} ${debug}
    </div>
  `;
}

export { TrifidResourceDescription };
