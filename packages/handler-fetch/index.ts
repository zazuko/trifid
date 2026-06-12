import { Worker } from 'node:worker_threads';
import { performance } from 'node:perf_hooks';

import { metrics } from '@opentelemetry/api';
import { v4 as uuidv4 } from 'uuid';

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { TrifidPlugin } from 'trifid-core';

import { waitForVariableToBeTrue } from './lib/utils.ts';

const meter = metrics.getMeter('handler-fetch');
const sparqlQueryCounter = meter.createCounter('sparql_queries_total', {
  description: 'Number of SPARQL queries received',
});

/**
 * A message exchanged with the worker thread.
 */
interface WorkerMessage {
  type: string;
  data: any;
}

export const factory: TrifidPlugin = async (trifid) => {
  const { config, logger, trifidEvents } = trifid;
  const { contentType, url, baseIri, graphName, unionDefaultGraph } = config;

  const queryLogLevel = typeof config.queryLogLevel === 'string' ? config.queryLogLevel : 'debug';
  const loggerByLevel = logger as unknown as Record<string, ((msg: string) => void) | undefined>;
  const logFn = loggerByLevel[queryLogLevel];
  if (!logFn) {
    throw Error(`Invalid queryLogLevel: ${queryLogLevel}`);
  }
  /**
   * Log a query, depending on the `queryLogLevel`.
   *
   * @param msg Message to log
   */
  const queryLogger = (msg: string) => logFn.call(logger, msg);

  const queryTimeout = 30000;

  // Reference the worker with the extension matching how this module runs:
  // `.ts` when executed from source (type-stripping), `.js` from the build.
  const workerExtension = import.meta.url.endsWith('.ts') ? '.ts' : '.js';
  const workerUrl = new URL(`./lib/worker${workerExtension}`, import.meta.url);
  const worker = new Worker(workerUrl);
  // Do not let the worker keep the process alive on its own: it is explicitly
  // terminated on the Trifid `close` event, but if startup fails before that
  // (e.g. the listener cannot bind), an un-terminated worker would otherwise
  // hang the process forever.
  worker.unref();

  let ready = false;
  let stopWait = false;

  trifidEvents.on('close', async () => {
    logger.debug('Got "close" event from Trifid ; closing worker…');
    await worker.terminate();
    logger.debug('Worker terminated');
  });

  worker.on('message', async (message: WorkerMessage) => {
    const { type, data } = message;
    if (type === 'log') {
      logger.debug(data);
    }
    if (type === 'ready') {
      if (!data) {
        logger.error('There was an error in the worker during initialization.');
      }
      ready = data;
      stopWait = true;
    }
  });

  worker.on('error', (error) => {
    ready = false;
    if (error instanceof Error) {
      logger.error(`Error from worker: ${error.message}`);
    } else {
      logger.error(`Error from worker: ${String(error)}`);
    }
  });

  worker.on('exit', (code) => {
    ready = false;
    logger.info(`Worker exited with code ${code}`);
  });

  worker.postMessage({
    type: 'config',
    data: {
      contentType, url, baseIri, graphName, unionDefaultGraph,
    },
  });

  /**
   * Send the query to the worker and wait for the response.
   *
   * @param query The SPARQL query
   * @returns The response and its content type
   */
  const handleQuery = async (query: string): Promise<{ response: string; contentType: string }> => {
    return new Promise((resolve, reject) => {
      if (!ready) {
        return reject(new Error('Worker is not ready'));
      }

      const queryId = uuidv4();

      const timeoutId = setTimeout(() => {
        worker.off('message', messageHandler);
        reject(new Error(`Query timed out after ${queryTimeout / 1000} seconds`));
      }, queryTimeout);

      worker.postMessage({
        type: 'query',
        data: {
          queryId,
          query,
        },
      });

      const messageHandler = (message: WorkerMessage) => {
        const { type, data } = message;
        if (type === 'query' && data.queryId === queryId) {
          clearTimeout(timeoutId);
          worker.off('message', messageHandler);
          if (!data.success) {
            reject(new Error(data.response));
            return;
          }
          resolve(data);
        }
      };

      worker.on('message', messageHandler);
    });
  };

  // Wait for the worker to become ready, so we can be sure it can handle queries
  await waitForVariableToBeTrue(
    () => stopWait,
    30000,
    20,
    'Worker did not become ready within 30 seconds',
  );

  if (!ready) {
    await worker.terminate();
    logger.debug('Worker terminated');
    throw new Error('Worker initialization error');
  }

  return {
    defaultConfiguration: async () => {
      return {
        methods: ['GET', 'POST'],
        paths: ['/query'],
      };
    },
    routeHandler: async () => {
      /**
       * Route handler.
       *
       * @param request Request.
       * @param reply Reply.
       */
      const handler = async (
        request: FastifyRequest & {
          opentelemetry?: () => {
            span: {
              setAttribute: (key: string, value: unknown) => void;
              addEvent: (name: string, attributes?: Record<string, unknown>) => void;
            };
          };
        },
        reply: FastifyReply,
      ) => {
        let query: string | undefined;
        const method = request.method;
        if (method === 'GET') {
          query = (request.query as { query?: string }).query;
        } else if (method === 'POST') {
          const body = request.body as { query?: string } | string | undefined;
          query = (body as { query?: string })?.query;
          if (!query && body) {
            query = typeof body === 'string' ? body : JSON.stringify(body);
          }
        }

        if (!query) {
          reply.status(400).send('Missing query parameter');
          return reply;
        }

        queryLogger(`Received query via ${method}:\n${query}`);

        if (request.opentelemetry) {
          const { span } = request.opentelemetry();
          span.setAttribute('db.system', 'sparql');
          span.addEvent('sparql.query', { statement: query });

          sparqlQueryCounter.add(1, { method });
        }

        try {
          const start = performance.now();
          const { response, contentType } = await handleQuery(query);
          const end = performance.now();
          const duration = end - start;
          reply.type(contentType);
          reply.header('Server-Timing', `handler-fetch;dur=${duration};desc="Query execution time"`);
          logger.debug(`Sending the following ${contentType} response:\n${response}`);
          reply.status(200).send(response);
        } catch (error) {
          logger.error(error);
          reply.status(500).send(error instanceof Error ? error.message : String(error));
          return reply;
        }

        return reply;
      };
      return handler;
    },
  };
};

export default factory;
