import ExpressAsPromise from 'express-as-promise'

async function createEndpoint () {
  const server = new ExpressAsPromise()

  server.queries = []

  server.app.use((req, res, next) => {
    const query = req.query.query

    server.queries.push(query)

    if (query.startsWith('ASK')) {
      return res.set('content-type', 'application/sparql-results+json').json({ boolean: true })
    }

    next()
  })

  await server.listen()

  return server
}

export default createEndpoint
