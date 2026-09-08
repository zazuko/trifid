import { strictEqual, ok } from 'node:assert';
import { describe, it } from 'node:test';
import { Readable } from 'node:stream';

import { LabelLoader, DEFAULT_LABEL_QUERY } from '../renderer/labels/labelLoader.ts';

/**
 * Create a label loader that records the query it sends instead of running it.
 *
 * @param options Label loader options.
 * @returns The loader and an accessor for the recorded query.
 */
const createLoader = (options: Record<string, unknown> = {}) => {
  let sentQuery = '';

  const loader = new LabelLoader({
    ...options,
    replaceIri: (value: string) => value,
    query: async (query: string) => {
      sentQuery = query;
      return { contentType: 'application/n-triples', response: Readable.from('') };
    },
  });

  return {
    loader,
    sentQuery: () => sentQuery,
  };
};

const iris = [{ value: 'http://example.org/a' }, { value: 'http://example.org/b' }];

describe('labelLoader', () => {
  it('should use the default query when none is configured', async () => {
    const { loader, sentQuery } = createLoader();
    await loader.fetchLabels(iris);

    ok(sentQuery().includes('?uri schema:name ?label'));
  });

  it('should use the configured query', async () => {
    const labelQuery =
      'CONSTRUCT { ?uri <http://www.w3.org/2000/01/rdf-schema#label> ?label } ' +
      'WHERE { ?uri <http://www.w3.org/2000/01/rdf-schema#label> ?label VALUES ?uri { {{iris}} } }';
    const { loader, sentQuery } = createLoader({ labelQuery });
    await loader.fetchLabels(iris);

    ok(sentQuery().includes('rdf-schema#label'));
    ok(!sentQuery().includes('schema:name'));
  });

  it('should replace the IRIs placeholder in the configured query', async () => {
    const { loader, sentQuery } = createLoader({
      labelQuery: 'CONSTRUCT { ?uri ?p ?o } WHERE { VALUES ?uri { {{iris}} } }',
    });
    await loader.fetchLabels(iris);

    strictEqual(
      sentQuery(),
      'CONSTRUCT { ?uri ?p ?o } WHERE { VALUES ?uri { <http://example.org/a> <http://example.org/b> } }',
    );
  });

  it('should replace every occurrence of the IRIs placeholder', async () => {
    const { loader, sentQuery } = createLoader({
      labelQuery: 'VALUES ?a { {{iris}} } VALUES ?b { {{iris}} }',
    });
    await loader.fetchLabels(iris);

    strictEqual(sentQuery().split('http://example.org/a').length - 1, 2);
  });

  it('should fall back to the default query for empty or invalid values', async () => {
    for (const labelQuery of ['', undefined, 42]) {
      const { loader, sentQuery } = createLoader({ labelQuery });
      await loader.fetchLabels(iris);

      ok(sentQuery().includes('?uri schema:name ?label'));
    }
  });

  it('should rewrite the IRIs before putting them in the query', async () => {
    const loader = new LabelLoader({
      replaceIri: (value: string) => value.replace('http://example.com/', 'http://example.org/'),
      query: async (query: string) => {
        ok(query.includes('<http://example.org/a>'));
        ok(!query.includes('example.com'));
        return { contentType: 'application/n-triples', response: Readable.from('') };
      },
    });

    await loader.fetchLabels([{ value: 'http://example.com/a' }]);
  });

  it('should expose the default query', () => {
    ok(DEFAULT_LABEL_QUERY.includes('{{iris}}'));
  });
});
