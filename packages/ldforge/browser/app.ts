import { createEditor, parseQueryWorkspace } from '@ldforge/editor';
import { createHttpExecutor, createQueryEndpointExecutor } from '@ldforge/core';
import {
  createTableRenderer,
  createBooleanRenderer,
  createJsonRenderer,
  createCardsRenderer,
} from '@ldforge/renderers';
import { createChartRenderer } from '@ldforge/charts';
import { createGeoRenderer } from '@ldforge/geo';
import { createNetworkRenderer } from '@ldforge/network';
import { createTimelineRenderer } from '@ldforge/timeline';
import { createPivotRenderer } from '@ldforge/pivot';
import { createTreeRenderer } from '@ldforge/tree';
import '@ldforge/editor/styles.css';
import './styles.css';

const config = JSON.parse(document.getElementById('ldforge-config')!.textContent!) as {
  endpoint: string;
  catalog: string[];
  defaultQuery: string;
  mapKind: string;
  urlShortener?: string;
};
const form = document.querySelector<HTMLFormElement>('#ldforge-connection')!;
const endpointInput = document.querySelector<HTMLInputElement>('#ldforge-endpoint')!;
const status = document.querySelector<HTMLOutputElement>('#ldforge-status')!;
const storageKey = `trifid.ldforge.${location.pathname}`;
const read = (key: string): unknown => {
  try {
    return JSON.parse(localStorage.getItem(`${storageKey}.${key}`) ?? 'null');
  } catch {
    return undefined;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(`${storageKey}.${key}`, JSON.stringify(value));
  } catch {
    /* Storage is optional. */
  }
};
const savedEndpoint = read('endpoint');
let endpoint = new URL(config.endpoint, location.href).href;
if (typeof savedEndpoint === 'string') {
  try {
    const saved = new URL(savedEndpoint);
    if (['http:', 'https:'].includes(saved.protocol)) endpoint = saved.href;
  } catch {
    /* Ignore invalid persisted connection data. */
  }
}
endpointInput.value = endpoint;
for (const value of new Set([config.endpoint, ...config.catalog])) {
  const option = document.createElement('option');
  option.value = new URL(value, location.href).href;
  document.getElementById('ldforge-endpoints')!.append(option);
}
form.addEventListener('submit', (event) => {
  event.preventDefault();
  editor.cancel();
  endpoint = new URL(endpointInput.value, location.href).href;
  endpointInput.value = endpoint;
  write('endpoint', endpoint);
  status.textContent = 'Connected';
});
const editor = createEditor(document.getElementById('ldforge-editor')!, {
  executor: createQueryEndpointExecutor({
    executor: { execute: (request) => createHttpExecutor({ endpoint }).execute(request) },
    onEndpoint: (value) => {
      status.textContent = `Query endpoint: ${value}`;
    },
  }),
  query: config.defaultQuery,
  workspace: parseQueryWorkspace(read('workspace')),
  shareEndpoint: () => endpoint,
  autoGrow: false,
  editorRows: 15,
  themeMainColor: '#c46500',
  visiblePlugins: ['table', 'json', 'geo', 'pivot'],
  onWorkspaceChange: (workspace) => write('workspace', workspace),
  renderers: [
    createTableRenderer(),
    createBooleanRenderer(),
    createJsonRenderer(),
    createCardsRenderer(),
    createChartRenderer(),
    createGeoRenderer(
      config.mapKind === 'swisstopo'
        ? {
            tileUrl:
              'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg',
            tileAttribution: '© swisstopo',
          }
        : {},
    ),
    createNetworkRenderer(),
    createTimelineRenderer(),
    createPivotRenderer(),
    createTreeRenderer(),
  ],
});
// Shared queries open a separate tab, preserving the saved workspace. Opening a
// link never executes a query or changes the active connection automatically.
const sharedQuery = new URL(location.href).searchParams.get('query');
if (sharedQuery !== null) editor.getTabs().addTab({ name: 'Shared query', query: sharedQuery });
if (config.urlShortener) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Copy short link';
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const response = await fetch(config.urlShortener!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: editor.getShareLink() }),
      });
      if (!response.ok) throw new Error(`Short link failed (${response.status})`);
      const shortUrl = new URL((await response.text()).trim(), location.href);
      if (!['http:', 'https:'].includes(shortUrl.protocol)) throw new Error('Invalid short link');
      await navigator.clipboard.writeText(shortUrl.href);
      status.textContent = 'Short link copied';
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'Could not copy short link';
    } finally {
      button.disabled = false;
    }
  });
  form.append(button);
}
window.addEventListener('pagehide', () => editor.destroy(), { once: true });
