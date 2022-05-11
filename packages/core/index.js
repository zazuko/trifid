import express from 'express'
import handler from './lib/config/handler.js'
import { defaultPort } from './lib/config/default.js'

const trifid = async (config) => {
  const fullConfig = await handler(config)
  const server = express()

  const port = fullConfig?.server?.listener?.port || defaultPort
  const host = '::'

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
