import 'fastify'

// The core decorates every request with a per-request session map (see the
// `onRequest` hook in `index.ts`) and the server instance with shared locals.
declare module 'fastify' {
  interface FastifyRequest {
    session: Map<string, unknown>
  }
  interface FastifyInstance {
    locals: Map<string, unknown>
  }
}
