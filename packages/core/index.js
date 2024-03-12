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
import pluginsAssembler from './lib/plugins/assembler.js'
import applyPlugins from './lib/plugins/apply.js'
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
 *   module: import('./types/index.js').TrifidPlugin,
 *   paths?: string | string[];
 *   methods?: string | string[];
 *   hosts?: string | string[];
 *   config?: Record<string, any>;
 * }>?} additionalPlugins Add additional plugins.
 * @returns {Promise<{
 *  start: () => Promise<import('fastify').FastifyInstance>;
 *  server: import('fastify').FastifyInstance;
 *  config: import('./types/index.js').TrifidConfig
 * }>} Trifid instance.
 */
const trifid = async (config, additionalPlugins = {}) => {
  const trifidEvents = new EventEmitter()
  const fullConfig = await handler(config)

  const serverOptions = fullConfig?.server?.options || {}

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
    ...serverOptions,
  })

  // This can be used to pass data from multiple plugins
  /** @type {Map<string, any>} */
  const trifidLocals = new Map()
  server.decorate('locals', trifidLocals)

  /**
   * Handler to add a session to the request.
   *
   * @param {import('fastify').FastifyRequest & { session: Map<string, any> }} request Request.
   * @param {import('fastify').FastifyReply} _reply Reply.
   * @param {import('fastify').DoneFuncWithErrOrRes} done Done.
   */
  const addSessionHandler = (request, _reply, done) => {
    request.session = new Map()
    done()
  }
  server.addHook('onRequest', addSessionHandler)

  // Add required plugins
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

  const plugins = await pluginsAssembler(
    fullConfig,
    additionalPlugins,
  )
  await applyPlugins(
    server,
    fullConfig.globals,
    plugins,
    logger,
    templateEngineInstance,
    `http://${host}:${portNumber}/`,
    trifidEvents,
  )

  const start = async () => {
    // Forward server events to the Trifid plugins
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
