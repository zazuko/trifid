const ExpressAsPromise = require('express-as-promise')

async function withServer (callback) {
  let error = null
  const server = new ExpressAsPromise()

  try {
    await callback(server)
  } catch (err) {
    error = err
  }

  if (server.server) {
    await server.stop()
  }

  if (error) {
    throw error
  }
}

module.exports = withServer
