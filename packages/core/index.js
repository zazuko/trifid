// @ts-check
import EventEmitter from 'node:events'

import { pino } from 'pino'
import fastify from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifyCookie from '@fastify/cookie'
import fastifyAccepts from '@fastify/accepts'
import fastifyFormBody from '@fastify/formbody'

import handler from './lib/config/handler.js'
import {
  defaultHost,
  defaultLogLevel,
  defaultPort,
} from './lib/config/default.js'
import middlewaresAssembler from './lib/middlewares/assembler.js'
import applyMiddlewares from './lib/middlewares/apply.js'
import templateEngine from './lib/templateEngine.js'
import { errorsHandler, notFoundHandler } from './lib/handlers/index.js'

// Export some useful functions to work with SPARQL
export {
  supportedTypes as sparqlSupportedTypes,
  serializeFormattedStream as sparqlSerializeFormattedStream,
  serializeQuadStream as sparqlSerializeQuadStream,
  getRewriteConfiguration as sparqlGetRewriteConfiguration,
} from './lib/sparql.js'

/**
 * Create a new Trifid instance.
 *
 * @param {import('./types/index.js').TrifidConfigWithExtends?} config Trifid configuration.
 * @param {Record<string, {
 *   order?: number,
 *   module: import('./types/index.js').TrifidMiddleware,
 *   paths?: string | string[];
 *   methods?: string | string[];
 *   hosts?: string | string[];
 *   config?: Record<string, any>;
 * }>?} additionalMiddlewares Add additional middlewares.
 * @returns {Promise<{
 *  start: () => Promise<import('fastify').FastifyInstance>;
 *  server: import('fastify').FastifyInstance;
 *  config: import('./types/index.js').TrifidConfig
 * }>} Trifid instance.
 */
const trifid = async (config, additionalMiddlewares = {}) => {
  const trifidEvents = new EventEmitter()
  const fullConfig = await handler(config)

  // // Configure Express server
  // if (fullConfig?.server?.express) {
  //   for (const expressSettingKey in fullConfig.server.express) {
  //     server.set(
  //       expressSettingKey,
  //       fullConfig.server.express[expressSettingKey],
  //     )
  //   }
  // }

  // Dynamic server configuration
  const portFromConfig = fullConfig?.server?.listener?.port
  const port = (portFromConfig === 0 || portFromConfig === '0') ? 0 : (portFromConfig || defaultPort)
  const host = fullConfig?.server?.listener?.host || defaultHost
  const portNumber = typeof port === 'string' ? parseInt(port, 10) : port

  // Logger configuration
  const logLevel = fullConfig?.server?.logLevel || defaultLogLevel

  // Template configuration
  const template = fullConfig?.template || {}

  // Custom logger instance
  const logger = pino({
    name: 'trifid-core',
    level: logLevel,
    transport: {
      target: 'pino-pretty',
    },
  })

  const server = fastify({
    logger: false,
    trustProxy: true,
  })

  // This can be used to pass data from multiple plugins
  /** @type {Map<string, any>} */
  const trifidLocals = new Map()
  server.decorate('locals', trifidLocals)

  // Add required middlewares
  server.register(fastifyCors, {
    credentials: true,
    origin: true,
  })

  // Add support for cookies
  server.register(fastifyCookie)

  // Add support for Accept header parser
  server.register(fastifyAccepts)

  // Add support for `application/x-www-form-urlencoded` content type
  server.register(fastifyFormBody)

  // Template engine configuration
  const templateEngineInstance = await templateEngine(template, trifidLocals)
  const { render } = templateEngineInstance

  // Add error and not found handlers (requires template engine to be ready)
  server.setErrorHandler(errorsHandler)
  server.setNotFoundHandler(await notFoundHandler({ render }))

  const middlewares = await middlewaresAssembler(
    fullConfig,
    additionalMiddlewares,
  )
  await applyMiddlewares(
    server,
    fullConfig.globals,
    middlewares,
    logger,
    templateEngineInstance,
    `http://${host}:${portNumber}/`,
    trifidEvents,
  )

  const start = async () => {
    // Forward server events to the Trifid middlewares
    server.addHook('onListen', () => {
      trifidEvents.emit('listen')
    })

    server.addHook('onClose', () => {
      trifidEvents.emit('close')
    })

    server.addHook('onReady', () => {
      trifidEvents.emit('ready')
    })

    // Start server
    await server.listen({
      port: portNumber,
      host,
    })

    // Log server address
    const fastifyAddresses = server.addresses().map((address) => {
      if (typeof address === 'string') {
        return address
      }
      return `http://${address.address}:${address.port}`
    })
    logger.info(`Server listening on ${fastifyAddresses.join(', ')}`)

    return server
  }

  return {
    start,
    server,
    config: fullConfig,
  }
}

export default trifid
