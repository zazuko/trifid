import ExpressAsPromise from 'express-as-promise'

const withServer = async (callback) => {
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

export default withServer
