import { strictEqual, ok, throws } from 'node:assert';
import { describe, it } from 'node:test';
import { Readable } from 'node:stream';

import rdf from '@zazuko/env';

import {
  LabelLoader,
  DEFAULT_LABEL_QUERY,
  DEFAULT_LABEL_PREDICATES,
  DEFAULT_MAX_TERMS,
} from '../renderer/labels/labelLoader.ts';

/**
 * Create a label loader that records the query it sends instead of running it.
 *
 * @param options Label loader options.
 * @returns The loader and an accessor for the recorded query.
 */
const createLoader = (options: Record<string, unknown> = {}) => {
  let sentQuery = '';

  const loader = new LabelLoader({
    // Defaults first so that a test can override them, except `query` which
    // always has to be the recorder below
    replaceIri: (value: string) => value,
    ...options,
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

    ok(sentQuery().includes('<http://schema.org/name>'));
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

      ok(sentQuery().includes('<http://schema.org/name>'));
    }
  });

  it('should rewrite the IRIs before putting them in the query', async () => {
    const { loader, sentQuery } = createLoader({
      labelQuery: 'VALUES ?uri { {{iris}} }',
      replaceIri: (value: string) => value.replace('http://example.com/', 'http://example.org/'),
    });

    await loader.fetchLabels([{ value: 'http://example.com/a' }]);

    // Asserting on the whole query keeps this exact: the rewritten IRI is the
    // only one that ends up in it
    strictEqual(sentQuery(), 'VALUES ?uri { <http://example.org/a> }');
  });

  it('should expose the default query', () => {
    ok(DEFAULT_LABEL_QUERY.includes('{{iris}}'));
  });

  describe('predicates', () => {
    /**
     * Build a pointer over a term carrying a single label predicate.
     *
     * @param predicate The predicate to use.
     * @returns The pointer and the term.
     */
    const pointerWith = (predicate: string) => {
      const dataset = rdf.dataset();
      const term = rdf.namedNode('http://example.org/a');
      dataset.add(rdf.quad(term, rdf.namedNode(predicate), rdf.literal('A label')));
      return { pointer: rdf.clownface({ dataset }), term };
    };

    it('should look for `schema:name` by default', async () => {
      const { loader, sentQuery } = createLoader();
      await loader.fetchLabels(iris);

      ok(sentQuery().includes('<http://schema.org/name>'));
      strictEqual(DEFAULT_LABEL_PREDICATES.length, 1);
    });

    it('should put the configured predicates in the query', async () => {
      const { loader, sentQuery } = createLoader({
        predicates: ['http://www.w3.org/2000/01/rdf-schema#label', 'http://schema.org/name'],
      });
      await loader.fetchLabels(iris);

      ok(sentQuery().includes('<http://www.w3.org/2000/01/rdf-schema#label>'));
      ok(sentQuery().includes('<http://schema.org/name>'));
    });

    it('should accept a single predicate that is not an array', async () => {
      const { loader, sentQuery } = createLoader({
        predicates: 'http://www.w3.org/2000/01/rdf-schema#label',
      });
      await loader.fetchLabels(iris);

      ok(sentQuery().includes('<http://www.w3.org/2000/01/rdf-schema#label>'));
      ok(!sentQuery().includes('<http://schema.org/name>'));
    });

    it('should consider a term without any of the predicates as unlabelled', () => {
      const { pointer, term } = pointerWith('http://www.w3.org/2000/01/rdf-schema#label');
      const { loader } = createLoader();

      // Only `schema:name` is looked for by default, so the term still needs a label
      strictEqual(loader.labelFilter(pointer, term), true);
    });

    it('should consider a term carrying a configured predicate as labelled', () => {
      const { pointer, term } = pointerWith('http://www.w3.org/2000/01/rdf-schema#label');
      const { loader } = createLoader({
        predicates: ['http://www.w3.org/2000/01/rdf-schema#label'],
      });

      strictEqual(loader.labelFilter(pointer, term), false);
    });

    it('should consider a term labelled when any of the predicates matches', () => {
      const { pointer, term } = pointerWith('http://schema.org/name');
      const { loader } = createLoader({
        predicates: ['http://www.w3.org/2000/01/rdf-schema#label', 'http://schema.org/name'],
      });

      strictEqual(loader.labelFilter(pointer, term), false);
    });

    it('should fall back to the default predicates for empty values', async () => {
      for (const predicates of [undefined, null, []]) {
        const { loader, sentQuery } = createLoader({ predicates });
        await loader.fetchLabels(iris);

        ok(sentQuery().includes('<http://schema.org/name>'));
      }
    });

    it('should reject predicates that are not valid IRIs', () => {
      throws(() => createLoader({ predicates: ['not-an-iri'] }), /is not a valid IRI/);
    });

    it('should reject predicates that are not non-empty strings', () => {
      throws(() => createLoader({ predicates: [''] }), /non-empty string/);
      throws(() => createLoader({ predicates: [42] }), /non-empty string/);
    });

    it('should expose the predicates placeholder to a custom query', async () => {
      const { loader, sentQuery } = createLoader({
        labelQuery: 'VALUES ?p { {{predicates}} } VALUES ?uri { {{iris}} }',
        predicates: ['http://www.w3.org/2000/01/rdf-schema#label'],
      });
      await loader.fetchLabels(iris);

      strictEqual(
        sentQuery(),
        'VALUES ?p { <http://www.w3.org/2000/01/rdf-schema#label> } ' +
          'VALUES ?uri { <http://example.org/a> <http://example.org/b> }',
      );
    });
  });

  describe('maxTerms', () => {
    /**
     * Build a pointer over the given number of unlabelled IRIs.
     *
     * @param count The number of terms to create.
     * @returns The pointer.
     */
    const pointerWithTerms = (count: number) => {
      const dataset = rdf.dataset();
      for (let i = 0; i < count; i += 1) {
        dataset.add(
          rdf.quad(
            rdf.namedNode(`http://example.org/s/${i}`),
            rdf.namedNode('http://example.org/p'),
            rdf.namedNode(`http://example.org/o/${i}`),
          ),
        );
      }
      return rdf.clownface({ dataset });
    };

    /**
     * Count the chunks a loader sends for the given pointer.
     *
     * @param options Label loader options.
     * @param pointer The pointer to fetch labels for.
     * @returns The number of chunks sent.
     */
    const countChunks = async (options: Record<string, unknown>, pointer: any) => {
      let chunks = 0;
      const loader = new LabelLoader({
        ...options,
        replaceIri: (value: string) => value,
        query: async () => {
          chunks += 1;
          return { contentType: 'application/n-triples', response: Readable.from('') };
        },
      });
      await loader.tryFetchAll(pointer);
      return chunks;
    };

    it('should bound the number of terms by default', async () => {
      // 700 quads -> 1401 unlabelled terms (700 subjects, 700 objects, 1 predicate),
      // which is above the default limit
      const chunks = await countChunks({ chunkSize: 100, timeout: 5000 }, pointerWithTerms(700));

      strictEqual(DEFAULT_MAX_TERMS, 1000);
      // Capped to 1000 terms instead of the 15 chunks the 1401 terms would need
      strictEqual(chunks, 10);
    });

    it('should use the configured limit', async () => {
      const chunks = await countChunks(
        { chunkSize: 10, maxTerms: 30, timeout: 5000 },
        pointerWithTerms(400),
      );

      strictEqual(chunks, 3);
    });

    it('should not limit the terms when set to zero', async () => {
      // 40 quads -> 81 terms (40 subjects, 40 objects, 1 predicate), all fetched
      const chunks = await countChunks(
        { chunkSize: 10, maxTerms: 0, timeout: 5000 },
        pointerWithTerms(40),
      );

      strictEqual(chunks, 9);
    });

    it('should keep the successful chunks when one fails, without hanging', async () => {
      let sent = 0;
      const loader = new LabelLoader({
        chunkSize: 10,
        concurrency: 1,
        timeout: 5000,
        maxTerms: 0,
        replaceIri: (value: string) => value,
        query: async () => {
          sent += 1;
          if (sent === 2) {
            throw new Error('endpoint is not keeping up');
          }
          return { contentType: 'application/n-triples', response: Readable.from('') };
        },
      });

      // `queue.clear()` leaves the pending promises unsettled, so this must not hang
      const datasets = await Promise.race([
        loader.tryFetchAll(pointerWithTerms(400)),
        new Promise((_resolve, reject) => setTimeout(() => reject(new Error('hung')), 5000)),
      ]);

      ok(Array.isArray(datasets));
      // The failing chunk stops the ones that had not started yet
      ok(sent < 80);
    });
  });
});
