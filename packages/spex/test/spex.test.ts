import { strictEqual } from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';

import trifidCore, { getListenerURL } from 'trifid-core';

import trifidPluginFactory from '../index.ts';

import type { FastifyInstance } from 'fastify';

describe('trifid-plugin-spex', () => {
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
        spex: {
          module: trifidPluginFactory,
          config: {
            endpointUrl: '/test',
          },
        },
      },
    );
    trifidListener = await trifidServer.start();
  });

  afterEach(async () => {
    await trifidListener.close();
  });

  it('can serve SPEX', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/spex/`);
    await res.text(); // Just make sure that the stream is consumed
    strictEqual(res.status, 200);
    strictEqual(res.redirected, false); // Should not redirect on this case
  });

  it('should redirect if trailing slash is missing', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/spex`);
    await res.text(); // Just make sure that the stream is consumed
    strictEqual(res.status, 200); // The redirection should lead to a correct page
    strictEqual(res.redirected, true); // Check the redirection
  });

  it('should serve the static JavaScript file', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/spex/static/spex.umd.cjs`);
    await res.text(); // Just make sure that the stream is consumed
    strictEqual(res.status, 200);
  });

  it('should serve the static CSS file', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/spex/static/spex.css`);
    await res.text(); // Just make sure that the stream is consumed
    strictEqual(res.status, 200);
  });
});

describe('trifid-plugin-spex served under a subpath', () => {
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
        spex: {
          module: trifidPluginFactory,
          config: {
            endpointUrl: '/test',
          },
        },
      },
    );
    trifidListener = await trifidServer.start();
  });

  afterEach(async () => {
    await trifidListener.close();
  });

  it('should serve SPEX under the subpath', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/SUBPATH/spex/`);
    await res.text();
    strictEqual(res.status, 200);
  });

  it('should not serve SPEX at the root anymore', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/spex/`);
    await res.text();
    strictEqual(res.status, 404);
  });

  it('should serve the static assets under the subpath', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/SUBPATH/spex/static/spex.umd.cjs`);
    await res.text();
    strictEqual(res.status, 200);
  });
});
