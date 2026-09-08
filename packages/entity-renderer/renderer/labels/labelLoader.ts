import { ns } from '@zazuko/rdf-entity-webcomponent/src/namespaces.js';
import PQueue from 'p-queue';
import rdf from '@zazuko/env';
import { parsers } from '@rdfjs/formats-common';
import type { Term } from '@rdfjs/types';

/**
 * labelNamespace: If specified, only fetches labels for iris starting with this
 * chunkSize: The number of labels to be fetched by each query
 * concurrency: Number of concurrent queries'
 * timeout: The timeout. Will return the successful chunks
 * labelQuery: The query used to fetch the labels
 * predicates: The predicates a label can be found under
 * maxTerms: The maximum number of terms to fetch labels for
 */

/**
 * The maximum number of terms labels are fetched for, unless configured
 * otherwise.
 *
 * Labels are fetched in chunks, so an entity referencing a very large number of
 * unlabelled IRIs would otherwise queue thousands of queries against the SPARQL
 * endpoint for a single page. Set it to `0` to remove the limit.
 */
const DEFAULT_MAX_TERMS = 1000;

/**
 * The predicates a label can be found under, unless configured otherwise.
 *
 * Only `schema:name` is used by default, which is what this loader has always
 * looked for. Instances that model their labels differently can widen this
 * through the `predicates` option, for example to match the properties the
 * renderer itself displays labels from (`foaf:name`, `skos:prefLabel`,
 * `schema:name` and `rdfs:label`).
 */
const DEFAULT_LABEL_PREDICATES = [ns.schema.name.value];

/**
 * The query used to fetch the labels of the terms that do not have one yet.
 *
 * `{{iris}}` is replaced by the chunk of IRIs the labels are fetched for, and
 * `{{predicates}}` by the configured predicates, both as a space separated list
 * of `<...>` terms.
 */
const DEFAULT_LABEL_QUERY = `
CONSTRUCT {
  ?uri ?predicate ?label .
} WHERE {
  GRAPH ?g {
    ?uri ?predicate ?label
    VALUES ?predicate { {{predicates}} }
    VALUES ?uri { {{iris}} }
  }
}`;

/**
 * Narrow the configured predicates to a usable list of IRIs.
 *
 * @param predicates The value coming from the configuration.
 * @returns The predicates to look for labels under.
 */
const parsePredicates = (predicates: unknown): string[] => {
  if (predicates === undefined || predicates === null) {
    return DEFAULT_LABEL_PREDICATES;
  }

  const values = Array.isArray(predicates) ? predicates : [predicates];
  if (values.length === 0) {
    return DEFAULT_LABEL_PREDICATES;
  }

  return values.map((value) => {
    if (typeof value !== 'string' || !value) {
      throw new Error('Each `labelLoader` predicate must be a non-empty string');
    }

    try {
      new URL(value);
    } catch (error) {
      throw new Error(`The \`labelLoader\` predicate '${value}' is not a valid IRI`, {
        cause: error,
      });
    }

    return value;
  });
};

class LabelLoader {
  query: any;
  replaceIri: any;
  rewriteResponse: any;
  headers: any;
  labelNamespaces: any;
  labelPredicates: string[];
  labelQuery: string;
  maxTerms: number;
  chunkSize: number;
  queue: PQueue;
  logger: any;

  constructor(options: any) {
    const {
      query,
      replaceIri,
      rewriteResponse,
      labelNamespace,
      labelNamespaces,
      labelQuery,
      predicates,
      maxTerms,
      chunkSize,
      concurrency,
      timeout,
      logger,
      headers,
    } = options;

    this.query = query;
    this.replaceIri = replaceIri;
    this.rewriteResponse = rewriteResponse;

    this.headers = headers;

    this.labelNamespaces = labelNamespace ? [labelNamespace] : labelNamespaces;
    this.labelPredicates = parsePredicates(predicates);
    this.maxTerms = Number.isFinite(maxTerms) && maxTerms >= 0 ? maxTerms : DEFAULT_MAX_TERMS;
    this.labelQuery =
      typeof labelQuery === 'string' && labelQuery ? labelQuery : DEFAULT_LABEL_QUERY;
    this.chunkSize = chunkSize || 30;
    this.queue = new PQueue({
      concurrency: concurrency || 2,
      timeout: timeout || 1000,
    });
    this.logger = logger;
  }

  labelFilter(pointer: any, term: any) {
    const inNamespaces = (term: any) => {
      if (!this.labelNamespaces || this.labelNamespaces.length === 0) {
        return true;
      }
      for (const current of this.labelNamespaces) {
        if (term.value.startsWith(current)) {
          return true;
        }
      }
      return false;
    };

    if (term.termType === 'NamedNode') {
      if (inNamespaces(term)) {
        const node = pointer.node(term);
        const hasLabel = this.labelPredicates.some(
          (predicate) => node.out(rdf.namedNode(predicate)).terms.length > 0,
        );
        return !hasLabel;
      }
    }
    return false;
  }

  getTermsWithoutLabel(pointer: any): Set<Term> {
    const result = rdf.termSet();
    pointer.dataset.map((quad: any) => {
      if (this.labelFilter(pointer, quad.subject)) {
        result.add(quad.subject);
      }
      if (this.labelFilter(pointer, quad.predicate)) {
        result.add(quad.predicate);
      }
      if (this.labelFilter(pointer, quad.object)) {
        result.add(quad.object);
      }
      return quad;
    });
    return result;
  }

  async fetchLabels(iris: any[]) {
    const uris = iris.map((x) => `<${this.replaceIri(x.value)}>`).join(' ');
    this.logger?.debug(`Fetching labels for terms without label: ${uris}`);
    const predicates = this.labelPredicates.map((predicate) => `<${predicate}>`).join(' ');
    const query = this.labelQuery
      .split('{{predicates}}')
      .join(predicates)
      .split('{{iris}}')
      .join(uris);
    const response = await this.query(query, {
      ask: false,
      rewriteResponse: this.rewriteResponse,
      headers: this.headers,
    });
    // Make sure the Content-Type is lower case and without parameters (e.g. charset)
    const fixedContentType = response.contentType.split(';')[0].trim().toLocaleLowerCase();
    const quadStream = parsers.import(fixedContentType, response.response);
    const dataset = await rdf.dataset().import(quadStream);
    return dataset;
  }

  async tryFetchAll(pointer: any) {
    const allTerms = [...this.getTermsWithoutLabel(pointer)];

    // Entities referencing a very large number of unlabelled IRIs would queue
    // thousands of queries for a single page, so only a bounded number of terms
    // is resolved.
    const terms =
      this.maxTerms > 0 && allTerms.length > this.maxTerms
        ? allTerms.slice(0, this.maxTerms)
        : allTerms;
    if (terms.length < allTerms.length) {
      this.logger?.warn(
        `Fetching labels for ${terms.length} of ${allTerms.length} terms without label ` +
          `(limited by 'maxTerms'), some labels will be missing`,
      );
    }

    const chunks = [];
    while (terms.length) {
      const chunk = terms.splice(0, this.chunkSize);
      if (chunk.length) {
        chunks.push(chunk);
      }
    }

    const datasets: any[] = [];
    let cancelled = false;
    let onCancelled: () => void = () => {};
    const cancellation = new Promise<void>((resolve) => {
      onCancelled = resolve;
    });

    /*
     * A chunk failing means the endpoint is not keeping up (the queue times out
     * each task), so the chunks that have not started yet are dropped instead of
     * being sent anyway. Note that `queue.clear()` leaves their promises
     * unsettled, hence the race below rather than awaiting all of them.
     */
    const cancel = () => {
      if (cancelled) {
        return;
      }
      cancelled = true;
      this.queue.clear();
      this.logger?.debug('Dropped the label chunks that had not started yet');
      onCancelled();
    };

    const tasks = chunks.map((chunk) =>
      this.queue
        .add(() => this.fetchLabels(chunk))
        .then((dataset) => {
          if (dataset) {
            datasets.push(dataset);
          }
        })
        .catch(() => cancel()),
    );

    await Promise.race([Promise.all(tasks), cancellation]);

    return datasets;
  }
}

export { LabelLoader, DEFAULT_LABEL_QUERY, DEFAULT_LABEL_PREDICATES, DEFAULT_MAX_TERMS };
