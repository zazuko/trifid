import { rejects, strictEqual } from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';

import trifidCore, { getListenerURL } from 'trifid-core';

import trifidPluginFactory from '../index.ts';

import type { FastifyInstance } from 'fastify';
import type { ConfigRecord } from 'trifid-core';

describe('trifid-plugin-graph-explorer', () => {
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
        graphExplorer: {
          module: trifidPluginFactory,
        },
      },
    );
    trifidListener = await trifidServer.start();
  });

  afterEach(async () => {
    await trifidListener.close();
  });

  it('can serve Graph Explorer', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/graph-explorer`);
    await res.text(); // Just make sure that the stream is consumed
    strictEqual(res.status, 200);
  });

  it('should redirect if trailing slash is missing', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/graph-explorer`);
    await res.text(); // Just make sure that the stream is consumed
    strictEqual(res.status, 200); // The redirection should lead to a correct page
    strictEqual(res.redirected, true); // Check the redirection
  });

  it('can serve static CSS style', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/graph-explorer/static/style.css`);
    await res.text(); // Just make sure that the stream is consumed
    strictEqual(res.status, 200);
  });

  it('can serve static JavaScript script', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/graph-explorer/static/app.js`);
    await res.text(); // Just make sure that the stream is consumed
    strictEqual(res.status, 200);
  });
});

describe('trifid-plugin-graph-explorer settings preset', () => {
  let trifidListener: FastifyInstance | undefined;

  /**
   * Start a Trifid instance with the given plugin configuration.
   *
   * @param config Plugin configuration.
   * @returns URL of the listener.
   */
  const start = async (config: ConfigRecord): Promise<string> => {
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
        graphExplorer: {
          module: trifidPluginFactory,
          config,
        },
      },
    );
    trifidListener = await trifidServer.start();
    return getListenerURL(trifidListener);
  };

  afterEach(async () => {
    if (trifidListener) {
      await trifidListener.close();
      trifidListener = undefined;
    }
  });

  it('should use OWLStatsSettings by default', async () => {
    const url = await start({});
    const res = await fetch(`${url}/graph-explorer/`);
    const body = await res.text();
    strictEqual(body.includes('"settingsPreset":"OWLStatsSettings"'), true);
  });

  it('should forward the configured preset to the client', async () => {
    const url = await start({ settingsPreset: 'QLeverSettings' });
    const res = await fetch(`${url}/graph-explorer/`);
    const body = await res.text();
    strictEqual(body.includes('"settingsPreset":"QLeverSettings"'), true);
  });

  it('should reject an unsupported preset', async () => {
    await rejects(
      () => start({ settingsPreset: 'QLever' }),
      /Unsupported settings preset 'QLever'/,
    );
  });
});
