import express from 'express'
import handler from './lib/config/handler.js'
import { defaultHost, defaultLogLevel, defaultPort } from './lib/config/default.js'
import middlewaresAssembler from './lib/middlewares/assembler.js'
import applyMiddlewares from './lib/middlewares/apply.js'
import pino from 'pino'

const trifid = async (config, additionalMiddlewares = {}) => {
  const fullConfig = await handler(config)
  const server = express()
  server.disable('x-powered-by')

  // dynamic server configuration
  const port = fullConfig?.server?.listener?.port || defaultPort
  const host = fullConfig?.server?.listener?.host || defaultHost

  // logger configuration
  const logLevel = fullConfig?.server?.logLevel || defaultLogLevel

  const logger = pino({
    name: 'trifid-core',
    level: logLevel,
    transport: {
      target: 'pino-pretty'
    }
  })

  const middlewares = await middlewaresAssembler(fullConfig, additionalMiddlewares)
  await applyMiddlewares(server, fullConfig.globals, middlewares, logger)

  const start = () => {
    server.listen(port, host, () => {
      logger.info(`listening on http://${host}:${port}/`)
    })
  }

  return {
    start,
    server,
    config: fullConfig
  }
}

export default trifid
