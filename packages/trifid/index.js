// @ts-check
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'

import { registerPlugin } from './lib/registerPlugin.js'
import healthPlugin from './plugins/health.js'
import templateEngine from './plugins/templateEngine.js'

const server = Fastify({
  logger: {
    level: 'debug',
  },
})

await server.register(cors, {
  origin: '*',
  credentials: true,
})
await server.register(helmet, {
  global: false,
})

await registerPlugin(server, templateEngine)
await registerPlugin(server, healthPlugin)

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '' })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
