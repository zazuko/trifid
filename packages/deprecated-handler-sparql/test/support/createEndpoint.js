import ExpressAsPromise from 'express-as-promise'

const createEndpoint = async (status = 200) => {
  const server = new ExpressAsPromise()

  server.requestHeaders = []
  server.queries = []

  server.app.use((req, res, next) => {
    const query = req.query.query

    server.requestHeaders.push(req.headers)
    server.queries.push(query)

    if (query.startsWith('ASK')) {
      return res
        .status(status)
        .set('content-type', 'application/sparql-results+json')
        .json({ boolean: true })
    }

    if (query.startsWith('DESCRIBE') || query.startsWith('CONSTRUCT')) {
      const body = 'hello'
      return res
        .writeHead(status, {
          'Content-Length': Buffer.byteLength(body),
          'Content-Type': req.headers.accept,
          'content-encoding': 'some encoding',
        })
        .end(body)
    }

    next()
  })

  await server.listen()

  return server
}

export { createEndpoint }
