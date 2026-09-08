import { strictEqual } from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';

import trifidCore, { getListenerURL } from 'trifid-core';

import trifidPluginFactory from '../index.ts';

import type { FastifyInstance } from 'fastify';

describe('trifid-plugin-yasgui', () => {
  describe('trifidPluginFactory', () => {
    it('should throw if the catalog option is not an array', async () => {
      try {
        // @ts-ignore (The other fields are not needed for this test)
        await trifidPluginFactory({ config: { catalog: 'not an array' } });
      } catch (err) {
        strictEqual((err as Error).message, '"catalog" option must be an array');
      }
    });
  });

  describe('instance', () => {
    let trifidListener: FastifyInstance;

    beforeEach(async () => {
      const trifidServer = await trifidCore(
        {
          server: {
            listener: {
              port: 0,
            },
            logLevel: 'warn',
          },
        },
        {
          yasgui: {
            module: trifidPluginFactory,
          },
        },
      );
      trifidListener = await trifidServer.start();
    });

    afterEach(async () => {
      await trifidListener.close();
    });

    it('can serve YASGUI', async () => {
      const res = await fetch(`${getListenerURL(trifidListener)}/sparql/`);
      await res.text(); // Just make sure that the stream is consumed
      strictEqual(res.status, 200);
    });

    it('should redirect if trailing slash is missing', async () => {
      const res = await fetch(`${getListenerURL(trifidListener)}/sparql`);
      await res.text(); // Just make sure that the stream is consumed
      strictEqual(res.status, 200); // The redirection should lead to a correct page
      strictEqual(res.redirected, true); // Check the redirection
    });

    it('can serve static CSS style', async () => {
      const res = await fetch(`${getListenerURL(trifidListener)}/yasgui-dist/yasgui.min.css`);
      await res.text(); // Just make sure that the stream is consumed
      strictEqual(res.status, 200);
    });

    it('can serve static JavaScript script', async () => {
      const res = await fetch(`${getListenerURL(trifidListener)}/yasgui-dist/yasgui.min.js`);
      await res.text(); // Just make sure that the stream is consumed
      strictEqual(res.status, 200);
    });

    it('can serve static Map plugin script', async () => {
      const res = await fetch(`${getListenerURL(trifidListener)}/yasgui-plugins/map.js`);
      await res.text(); // Just make sure that the stream is consumed
      strictEqual(res.status, 200);
    });

    it('can serve static Map plugin style', async () => {
      const res = await fetch(`${getListenerURL(trifidListener)}/yasgui-plugins/map.css`);
      await res.text(); // Just make sure that the stream is consumed
      strictEqual(res.status, 200);
    });

    it('can serve static Pivot plugin script', async () => {
      const res = await fetch(`${getListenerURL(trifidListener)}/yasgui-plugins/pivot.js`);
      await res.text(); // Just make sure that the stream is consumed
      strictEqual(res.status, 200);
    });

    it('can serve the Trifid style', async () => {
      const res = await fetch(`${getListenerURL(trifidListener)}/yasgui-public/yasgui.css`);
      await res.text(); // Just make sure that the stream is consumed
      strictEqual(res.status, 200);
    });

    it('can serve marker icon SVG', async () => {
      const res = await fetch(`${getListenerURL(trifidListener)}/yasgui-public/marker-icon.svg`);
      await res.text(); // Just make sure that the stream is consumed
      strictEqual(res.status, 200);
    });
  });
});

describe('trifid-plugin-yasgui served under a subpath', () => {
  let trifidListener: FastifyInstance;

  beforeEach(async () => {
    const trifidServer = await trifidCore(
      {
        server: {
          listener: {
            port: 0,
          },
          logLevel: 'warn',
          subpath: '/SUBPATH',
        },
      },
      {
        yasgui: {
          module: trifidPluginFactory,
          paths: ['/sparql', '/sparql/'],
        },
      },
    );
    trifidListener = await trifidServer.start();
  });

  afterEach(async () => {
    await trifidListener.close();
  });

  it('should serve YASGUI under the subpath', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/SUBPATH/sparql/`);
    await res.text();
    strictEqual(res.status, 200);
  });

  it('should not serve YASGUI at the root anymore', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/sparql/`);
    await res.text();
    strictEqual(res.status, 404);
  });

  it('should serve the static assets under the subpath', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/SUBPATH/yasgui-dist/yasgui.min.css`);
    await res.text();
    strictEqual(res.status, 200);
  });

  it('should reference the assets with the subpath in the page', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/SUBPATH/sparql/`);
    const body = await res.text();
    strictEqual(body.includes('/SUBPATH/yasgui-dist/yasgui.min.js'), true);
    strictEqual(body.includes('"/yasgui-dist/yasgui.min.js"'), false);
  });
});
