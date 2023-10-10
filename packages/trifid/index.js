// @ts-check
import Fastify from 'fastify'
import healthMiddleware from './middlewares/health.js'

const server = Fastify({
  logger: {
    level: 'debug',
  },
})

// Health check
server.get('/healthz', healthMiddleware)

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '' })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
