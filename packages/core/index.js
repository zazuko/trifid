import express from 'express'
import handler from './lib/config/handler.js'
import { defaultHost, defaultPort } from './lib/config/default.js'
import middlewaresAssembler from './lib/middlewares/assembler.js'
import applyMiddlewares from './lib/middlewares/apply.js'

const trifid = async (config, additionalMiddlewares = {}) => {
  const fullConfig = await handler(config)
  const server = express()
  server.disable('x-powered-by')

  const port = fullConfig?.server?.listener?.port || defaultPort
  const host = fullConfig?.server?.listener?.host || defaultHost

  const middlewares = await middlewaresAssembler(fullConfig, additionalMiddlewares)
  await applyMiddlewares(server, fullConfig.globals, middlewares)

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
