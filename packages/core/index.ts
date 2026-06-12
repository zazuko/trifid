import './otel.ts';

import EventEmitter from 'node:events';

import pino from 'pino';
import fastify from 'fastify';
import fastifyCompress from '@fastify/compress';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifyAccepts from '@fastify/accepts';
import fastifyFormBody from '@fastify/formbody';

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { LoggerOptions } from 'pino';

import handler from './lib/config/handler.ts';
import {
  defaultHost,
  defaultLogLevel,
  defaultLogFormat,
  defaultPort,
} from './lib/config/default.ts';
import pluginsAssembler from './lib/plugins/assembler.ts';
import applyPlugins from './lib/plugins/apply.ts';
import templateEngine from './lib/templateEngine.ts';
import { errorsHandler, notFoundHandler } from './lib/handlers/index.ts';

import type {
  ConfigRecord,
  TrifidConfig,
  TrifidConfigWithExtends,
  TrifidPlugin,
} from './types/index.ts';

// Export some useful functions to work with SPARQL
export {
  supportedTypes as sparqlSupportedTypes,
  serializeFormattedStream as sparqlSerializeFormattedStream,
  serializeQuadStream as sparqlSerializeQuadStream,
  getRewriteConfiguration as sparqlGetRewriteConfiguration,
} from './lib/sparql.ts';

// Export some functions that can be used for testing
export {
  assertRejection,
  getListenerURL,
} from './lib/test.ts';

// Re-export the public types so that plugins can consume them from the package
// entry (`import type { TrifidPlugin } from 'trifid-core'`).
export type {
  ConfigRecord,
  FastifyRouteHandler,
  LogFormat,
  LogLevel,
  ObjectWithExtends,
  RegisterTemplateHelper,
  RenderFunction,
  RequestWithSession,
  SessionData,
  TemplateEngineInstance,
  TrifidConfig,
  TrifidConfigWithExtends,
  TrifidPlugin,
  TrifidPluginArgument,
  TrifidPluginConfig,
  TrifidPluginSetup,
  TrifidQuery,
  TrifidQueryOptions,
  TrifidServer,
  TrifidServerConfig,
} from './types/index.ts';

/**
 * Create a new Trifid instance.
 *
 * @param config Trifid configuration.
 * @param additionalPlugins Add additional plugins.
 * @returns Trifid instance.
 */
const trifid = async (
  config?: TrifidConfigWithExtends | null,
  additionalPlugins: Record<string, {
    order?: number;
    module: TrifidPlugin;
    paths?: string | string[];
    methods?: string | string[];
    hosts?: string | string[];
    config?: ConfigRecord;
  }> = {},
): Promise<{
  start: () => Promise<FastifyInstance>;
  server: FastifyInstance;
  config: TrifidConfig;
}> => {
  const trifidEvents = new EventEmitter();
  const fullConfig = await handler(config ?? {});

  const serverOptions = fullConfig?.server?.options || {};

  // Template configuration
  const template = fullConfig?.template || {};

  // Dynamic server configuration
  const portFromConfig = fullConfig?.server?.listener?.port;
  const port = (portFromConfig === 0 || portFromConfig === '0') ? 0 : (portFromConfig || defaultPort);
  const host = fullConfig?.server?.listener?.host || defaultHost;
  const portNumber = typeof port === 'string' ? parseInt(port, 10) : port;

  // Logger configuration
  const logLevel = fullConfig?.server?.logLevel || defaultLogLevel;
  const logFormat = fullConfig?.server?.logFormat || defaultLogFormat;
  const loggerConfig: LoggerOptions = {
    name: 'trifid-core',
    level: logLevel,
  };
  if (logFormat === 'pretty') {
    loggerConfig.transport = {
      target: 'pino-pretty',
    };
  }

  // Custom logger instance
  const logger = pino(loggerConfig);

  const server = await fastify({
    logger: false,
    trustProxy: true,
    ...serverOptions,
  });

  // Register fastifyCompress and add custom compressible mime-types (in addition to mime-db)
  await server.register(fastifyCompress, { customTypes: /(turtle|n-triples|n-quads|trig|json)(;.+)?$/ });

  // Add support for `application/sparql-query` content type
  server.addContentTypeParser('application/sparql-query', (_request, payload, done) => {
    const data: unknown[] = [];
    payload.on('data', (chunk) => data.push(chunk));
    payload.on('end', () => {
      try {
        const parsed = data.join('');
        done(null, parsed);
      } catch (err) {
        done(err as Error, undefined);
      }
    });
  });

  // This can be used to pass data from multiple plugins
  const trifidLocals = new Map<string, unknown>();
  server.decorate('locals', trifidLocals);

  /**
   * Handler to add a session to the request.
   *
   * @param request Request.
   * @param _reply Reply.
   * @param done Done.
   */
  const addSessionHandler = (
    request: FastifyRequest,
    _reply: FastifyReply,
    done: (err?: Error) => void,
  ) => {
    request.session = new Map();
    done();
  };
  server.addHook('onRequest', addSessionHandler);

  // Add required plugins
  server.register(fastifyCors, {
    credentials: true,
    origin: true,
  });

  // Add support for cookies
  server.register(fastifyCookie);

  // Add support for Accept header parser
  server.register(fastifyAccepts);

  // Add support for `application/x-www-form-urlencoded` content type
  server.register(fastifyFormBody);

  // Template engine configuration
  const templateEngineInstance = await templateEngine(template, trifidLocals);
  const { render } = templateEngineInstance;

  // Add error and not found handlers (requires template engine to be ready)
  server.setErrorHandler(errorsHandler);
  const notFoundHandlerFn = await notFoundHandler({ render });
  server.setNotFoundHandler(notFoundHandlerFn);

  // Wrapper exposed to plugins: uses reply.callNotFound() (which switches the
  // route context to the 404 context, bypassing per-route onSend hooks such as
  // compression) and waits for the raw response to be fully written before
  // resolving.  This lets async plugin handlers return safely without
  // wrapThenable racing and sending a second, empty response.
  const notFound = (_request: FastifyRequest, reply: FastifyReply): Promise<void> =>
    new Promise<void>((resolve) => {
      const onDone = () => {
        reply.raw.off('finish', onDone);
        reply.raw.off('close', onDone);
        resolve();
      };
      reply.raw.once('finish', onDone);
      reply.raw.once('close', onDone);
      reply.callNotFound();
    });

  const plugins = await pluginsAssembler(
    fullConfig,
    additionalPlugins,
  );
  await applyPlugins(
    server,
    fullConfig.globals ?? {},
    plugins,
    logger,
    templateEngineInstance,
    `http://${host}:${portNumber}/`,
    trifidEvents,
    notFound,
  );

  const start = async () => {
    // Forward server events to the Trifid plugins
    server.addHook('onListen', () => {
      trifidEvents.emit('listen');
    });

    server.addHook('onClose', () => {
      trifidEvents.emit('close');
    });

    server.addHook('onReady', () => {
      trifidEvents.emit('ready');
    });

    // Start server
    await server.listen({
      port: portNumber,
      host,
    });

    // Log server address
    const fastifyAddresses = server.addresses().map((address) => {
      if (typeof address === 'string') {
        return address;
      }
      return `http://${address.address}:${address.port}`;
    });
    logger.info(`Server listening on ${fastifyAddresses.join(', ')}`);

    return server;
  };

  return {
    start,
    server,
    config: fullConfig,
  };
};

export default trifid;
