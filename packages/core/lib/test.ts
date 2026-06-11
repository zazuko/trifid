/**
 * This file contains utility functions for tests.
 * This can be used to test any other plugin.
 */

import type { FastifyInstance } from 'fastify'

/**
 * Get an endpoint of the Fastify Instance.
 *
 * @param server Server.
 */
export const getListenerURL = (server: FastifyInstance): string => {
  const addresses = server.addresses().map((address) => {
    if (typeof address === 'string') {
      return address
    }
    return `http://${address.address}:${address.port}`
  })

  const [firstAddress] = addresses
  if (firstAddress === undefined) {
    throw new Error('The listener is not listening')
  }

  return firstAddress
}

/**
 * Assert that a promise is rejected.
 *
 * @param promise The promise to assert.
 * @returns A promise that resolves when the assertion is done.
 */
export const assertRejection = (promise: Promise<unknown>): Promise<void> => {
  return promise.then(
    () => {
      throw new Error('Expected promise to be rejected')
    },
    () => { },
  )
}
