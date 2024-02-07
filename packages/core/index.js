// @ts-check
import express from 'express'
import { pino } from 'pino'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { middleware as absoluteUrl } from 'absolute-url'

import handler from './lib/config/handler.js'
import {
  defaultHost,
  defaultLogLevel,
  defaultPort,
} from './lib/config/default.js'
import middlewaresAssembler from './lib/middlewares/assembler.js'
import applyMiddlewares from './lib/middlewares/apply.js'
import templateEngine from './lib/templateEngine.js'

// Export some useful functions to work with SPARQL
export {
  supportedTypes as sparqlSupportedTypes,
  serializeFormattedStream as sparqlSerializeFormattedStream,
  serializeQuadStream as sparqlSerializeQuadStream,
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
 *  start: () => Promise<import('http').Server>;
 *  server: import('express').Express;
 *  config: import('./types/index.js').TrifidConfig
 * }>} Trifid instance.
 */
const trifid = async (config, additionalMiddlewares = {}) => {
  const fullConfig = await handler(config)
  const server = express()
  server.disable('x-powered-by')

  // Add required middlewares
  server.use(
    cors({
      credentials: true,
      origin: true,
    }),
  )

  // Add support for JSON-encoded and URL-encoded bodies
  server.use(express.json())
  server.use(express.urlencoded({ extended: true }))

  // Add support for cookies
  server.use(cookieParser())

  // Add support for absolute URLs, so that we can use `req.absoluteUrl()` in any middleware to get the absolute URL
  server.use(absoluteUrl())

  // Configure Express server
  if (fullConfig?.server?.express) {
    for (const expressSettingKey in fullConfig.server.express) {
      server.set(
        expressSettingKey,
        fullConfig.server.express[expressSettingKey],
      )
    }
  }

  // Dynamic server configuration
  const port = fullConfig?.server?.listener?.port || defaultPort
  const host = fullConfig?.server?.listener?.host || defaultHost
  const portNumber = typeof port === 'string' ? parseInt(port, 10) : port

  // Logger configuration
  const logLevel = fullConfig?.server?.logLevel || defaultLogLevel

  // Template configuration
  const template = fullConfig?.template || {}

  const logger = pino({
    name: 'trifid-core',
    level: logLevel,
    transport: {
      target: 'pino-pretty',
    },
  })

  const templateEngineInstance = await templateEngine(template)
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
  )

  const start = async () => {
    return await new Promise((resolve, reject) => {
      const listener = server.listen(portNumber, host, (err) => {
        if (err) {
          return reject(err)
        }

        logger.info(`Trifid instance listening on: http://${host}:${portNumber}/`)
        resolve(listener)
      })
    })
  }

  return {
    start,
    server,
    config: fullConfig,
  }
}

export default trifid
