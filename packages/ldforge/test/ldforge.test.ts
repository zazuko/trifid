import { strictEqual, ok, rejects } from 'node:assert';
import { describe, it } from 'node:test';
import trifidCore from 'trifid-core';
import factory from '../index.ts';

async function instance(subpath = '/', config: Record<string, unknown> = {}) {
  const app = await trifidCore(
    { server: { subpath, logLevel: 'silent', listener: { port: 0 } } },
    {
      ldforge: { module: factory, config },
    },
  );
  await app.server.ready();
  return app.server;
}

describe('Native LDForge plugin', () => {
  for (const subpath of ['/', '/SUBPATH/']) {
    it(`serves the editor, assets and redirects under ${subpath}`, async () => {
      const server = await instance(subpath);
      try {
        const page = await server.inject(`${subpath}sparql/`);
        strictEqual(page.statusCode, 200);
        ok(page.body.includes(`${subpath}ldforge-assets/app.js`));
        ok(page.body.includes(`${subpath}ldforge-assets/app.css`));
        const json = JSON.parse(page.body.match(/type="application\/json">(.*?)<\/script>/s)![1]!);
        strictEqual(json.endpoint, `${subpath}query`);
        for (const asset of ['app.js', 'app.css']) {
          const response = await server.inject(`${subpath}ldforge-assets/${asset}`);
          strictEqual(response.statusCode, 200);
          ok(response.body.length > 100);
        }
        const redirect = await server.inject(`${subpath}sparql?query=ASK%7B%7D`);
        strictEqual(redirect.statusCode, 302);
        strictEqual(redirect.headers.location, `${subpath}sparql/?query=ASK%7B%7D`);
        if (subpath !== '/') strictEqual((await server.inject('/sparql/')).statusCode, 404);
      } finally {
        await server.close();
      }
    });
  }
  it('safely transports queries and endpoint catalogues containing HTML', async () => {
    const query = 'SELECT "</script><script>alert(1)</script>" WHERE {}';
    const server = await instance('/', {
      defaultQuery: query,
      endpointUrl: 'https://example.org/query',
      catalog: ['https://example.org/?q=<script>'],
    });
    try {
      const page = await server.inject('/sparql/');
      ok(!page.body.includes('<script>alert(1)</script>'));
      const json = JSON.parse(page.body.match(/type="application\/json">(.*?)<\/script>/s)![1]!);
      strictEqual(json.defaultQuery, query);
      strictEqual(json.catalog[0], 'https://example.org/?q=<script>');
      strictEqual(json.endpoint, 'https://example.org/query');
    } finally {
      await server.close();
    }
  });
  for (const config of [{ catalog: 'bad' }, { catalog: [42] }, { mapKind: 'bad' }]) {
    it(`rejects invalid config ${JSON.stringify(config)}`, async () => {
      await rejects(instance('/', config));
    });
  }
});
