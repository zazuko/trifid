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

/**
 * Create a new Trifid instance.
 *
 * @param {import('./types/index.js').TrifidConfigWithExtends?} config Trifid configuration.
 * @param {Record<string, {
 *   order?: number,
 *   module: import('./types/index.d.ts').TrifidMiddleware,
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

  // add required middlewares
  server.use(
    cors({
      credentials: true,
      origin: true,
    }),
  )
  server.use(cookieParser())
  server.use(absoluteUrl())

  // configure Express server
  if (fullConfig?.server?.express) {
    for (const expressSettingKey in fullConfig.server.express) {
      server.set(
        expressSettingKey,
        fullConfig.server.express[expressSettingKey],
      )
    }
  }

  // dynamic server configuration
  const port = fullConfig?.server?.listener?.port || defaultPort
  const host = fullConfig?.server?.listener?.host || defaultHost
  const portNumber = typeof port === 'string' ? parseInt(port, 10) : port

  // logger configuration
  const logLevel = fullConfig?.server?.logLevel || defaultLogLevel

  // template configuration
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
