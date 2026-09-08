import { describe, it } from 'node:test';
import { strictEqual, ok } from 'node:assert';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import trifidCore, {
  getListenerURL,
  normalizeSubpath,
  joinSubpath,
  sparqlGetRewriteConfiguration,
} from '../index.ts';

import staticPlugin from '../plugins/static.ts';
import healthPlugin from '../plugins/health.ts';

import type { FastifyInstance } from 'fastify';

const currentDir = dirname(fileURLToPath(import.meta.url));

/**
 * Start a Trifid instance, optionally served under a subpath.
 *
 * @param subpath The subpath to serve the instance under.
 * @returns The started listener.
 */
const startInstance = async (subpath?: string): Promise<FastifyInstance> => {
  const trifidInstance = await trifidCore(
    {
      server: {
        listener: {
          port: 0,
        },
        logLevel: 'warn',
        ...(subpath ? { subpath } : {}),
      },
    },
    {
      health: {
        module: healthPlugin,
      },
      static: {
        module: staticPlugin,
        config: {
          directory: `${currentDir}/support/`,
        },
      },
    },
  );

  return await trifidInstance.start();
};

describe('subpath', () => {
  describe('normalizeSubpath', () => {
    it('should default to the root path', () => {
      strictEqual(normalizeSubpath(undefined), '/');
      strictEqual(normalizeSubpath(''), '/');
      strictEqual(normalizeSubpath('/'), '/');
    });

    it('should add the leading and trailing slashes', () => {
      strictEqual(normalizeSubpath('SUBPATH'), '/SUBPATH/');
      strictEqual(normalizeSubpath('/SUBPATH'), '/SUBPATH/');
      strictEqual(normalizeSubpath('/SUBPATH/'), '/SUBPATH/');
    });

    it('should collapse duplicate slashes and trim the value', () => {
      strictEqual(normalizeSubpath('//a//b//'), '/a/b/');
      strictEqual(normalizeSubpath('  /x  '), '/x/');
    });

    it('should ignore values that are not strings', () => {
      strictEqual(normalizeSubpath(42), '/');
      strictEqual(normalizeSubpath(null), '/');
    });
  });

  describe('joinSubpath', () => {
    it('should leave paths untouched for the default subpath', () => {
      strictEqual(joinSubpath('/', '/sparql'), '/sparql');
      strictEqual(joinSubpath('/', '/*'), '/*');
    });

    it('should prefix paths with the subpath', () => {
      strictEqual(joinSubpath('/SUBPATH/', '/sparql'), '/SUBPATH/sparql');
      strictEqual(joinSubpath('/SUBPATH/', '/sparql/'), '/SUBPATH/sparql/');
      strictEqual(joinSubpath('/SUBPATH/', '/*'), '/SUBPATH/*');
      strictEqual(joinSubpath('/SUBPATH/', '/'), '/SUBPATH/');
    });
  });

  describe('without a configured subpath', () => {
    it('should serve routes at the root', async () => {
      const listener = await startInstance();
      const response = await fetch(`${getListenerURL(listener)}/healthz`);
      await response.text();
      await listener.close();

      strictEqual(response.status, 200);
    });

    it('should serve static files at the root', async () => {
      const listener = await startInstance();
      const response = await fetch(`${getListenerURL(listener)}/test.txt`);
      const body = await response.text();
      await listener.close();

      strictEqual(response.status, 200);
      strictEqual(body.trim(), 'some text');
    });

    it('should render templates with root-relative assets', async () => {
      const listener = await startInstance();
      const response = await fetch(`${getListenerURL(listener)}/not-found`, {
        headers: { accept: 'text/html' },
      });
      const body = await response.text();
      await listener.close();

      ok(body.includes('href="/static/core/style.css"'));
    });
  });

  describe('with a configured subpath', () => {
    it('should serve routes under the subpath', async () => {
      const listener = await startInstance('/SUBPATH');
      const response = await fetch(`${getListenerURL(listener)}/SUBPATH/healthz`);
      await response.text();
      await listener.close();

      strictEqual(response.status, 200);
    });

    it('should not serve routes at the root anymore', async () => {
      const listener = await startInstance('/SUBPATH');
      const response = await fetch(`${getListenerURL(listener)}/healthz`);
      await response.text();
      await listener.close();

      strictEqual(response.status, 404);
    });

    it('should serve static files under the subpath', async () => {
      const listener = await startInstance('/SUBPATH');
      const response = await fetch(`${getListenerURL(listener)}/SUBPATH/test.txt`);
      const body = await response.text();
      await listener.close();

      strictEqual(response.status, 200);
      strictEqual(body.trim(), 'some text');
    });

    it('should render templates with subpath-prefixed assets', async () => {
      const listener = await startInstance('/SUBPATH');
      const response = await fetch(`${getListenerURL(listener)}/SUBPATH/not-found`, {
        headers: { accept: 'text/html' },
      });
      const body = await response.text();
      await listener.close();

      ok(body.includes('href="/SUBPATH/static/core/style.css"'));
      ok(!body.includes('href="/static/core/style.css"'));
    });

    it('should accept a subpath configured without slashes', async () => {
      const listener = await startInstance('SUBPATH');
      const response = await fetch(`${getListenerURL(listener)}/SUBPATH/healthz`);
      await response.text();
      await listener.close();

      strictEqual(response.status, 200);
    });
  });

  describe('IRI rewriting', () => {
    const datasetBaseUrl = 'http://example.org/';

    it('should map a request to the dataset IRI without a subpath', () => {
      const { replaceIri, iriOrigin } = sparqlGetRewriteConfiguration(true, datasetBaseUrl);
      const requested = 'https://example.com/path/resource';

      strictEqual(replaceIri(requested), 'http://example.org/path/resource');
      strictEqual(iriOrigin(requested), 'https://example.com/');
    });

    it('should strip the subpath when mapping a request to the dataset IRI', () => {
      const { replaceIri } = sparqlGetRewriteConfiguration(true, datasetBaseUrl, '/SUBPATH/');

      strictEqual(
        replaceIri('https://example.com/SUBPATH/path/resource'),
        'http://example.org/path/resource',
      );
    });

    it('should rewrite the responses back to the subpath', () => {
      const { iriOrigin } = sparqlGetRewriteConfiguration(true, datasetBaseUrl, '/SUBPATH/');

      // This is the replacement used to rewrite dataset IRIs in the responses
      strictEqual(
        iriOrigin('https://example.com/SUBPATH/path/resource'),
        'https://example.com/SUBPATH/',
      );
    });
  });
});
