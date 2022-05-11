import express from 'express'
import handler from './lib/config/handler.js'
import { defaultPort } from './lib/config/default.js'
import healthMiddleware from './middlewares/health.js'
import middlewaresAssembler from './lib/middlewares/assembler.js'
import applyMiddlewares from './lib/middlewares/apply.js'

const trifid = async (config, additionalMiddlewares = {}) => {
  const fullConfig = await handler(config)
  const server = express()

  const port = fullConfig?.server?.listener?.port || defaultPort
  const host = '::'

  const middlewares = await middlewaresAssembler(fullConfig, additionalMiddlewares)
  await applyMiddlewares(server, middlewares)

  server.use('/health', healthMiddleware({}))

  const start = () => {
    server.listen(port, host)
  }

  return {
    start,
    server,
    config: fullConfig
  }
}

export default trifid
