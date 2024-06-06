// @ts-check

/**
 * This file contains utility functions for tests.
 * This can be used to test any other plugin.
 */

/**
 * Get an endpoint of the Fastify Instance.
 *
 * @param {import('fastify').FastifyInstance} server Server.
 * @returns {string}
 */
export const getListenerURL = (server) => {
  const addresses = server.addresses().map((address) => {
    if (typeof address === 'string') {
      return address
    }
    return `http://${address.address}:${address.port}`
  })

  if (addresses.length < 1) {
    throw new Error('The listener is not listening')
  }

  return addresses[0]
}

/**
 * Assert that a promise is rejected.
 *
 * @param {Promise<any>} promise The promise to assert.
 * @returns {Promise<void>} A promise that resolves when the assertion is done.
 */
export const assertRejection = (promise) => {
  return promise.then(
    () => {
      throw new Error('Expected promise to be rejected')
    },
    () => { },
  )
}
