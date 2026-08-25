import { strictEqual } from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';

import trifidCore, { getListenerURL } from 'trifid-core';

import trifidPluginFactory from '../index.ts';

import type { FastifyInstance } from 'fastify';

describe('@zazuko/trifid-plugin-iiif', () => {
  describe('Trifid plugin', () => {
    it('should throw an error if no endpoint parameter is provided', async () => {
      try {
        // @ts-expect-error deliberately called without the required plugin argument
        await trifidPluginFactory({});
      } catch (e) {
        strictEqual((e as Error).message, 'missing endpointUrl parameter');
      }
    });
  });

  describe('Trifid instance', () => {
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
          iiif: {
            module: trifidPluginFactory,
            config: {
              endpointUrl: 'http://example.org/query',
            },
          },
        },
      );
      trifidListener = await trifidServer.start();
    });

    afterEach(async () => {
      await trifidListener.close();
    });

    it('should 404', async () => {
      const res = await fetch(`${getListenerURL(trifidListener)}/iiif/`);
      await res.text(); // Just make sure that the stream is consumed
      strictEqual(res.status, 404);
    });

    it('can serve IIIF', async () => {
      const res = await fetch(
        `${getListenerURL(trifidListener)}/iiif/?uri=http://example.org/data`,
      );
      await res.text(); // Just make sure that the stream is consumed
      // @TODO: use a real SPARQL endpoint to get real results ; the 500 is due to the fact that the SPARQL endpoint is not real
      strictEqual(res.status, 500);
    });
  });
});
