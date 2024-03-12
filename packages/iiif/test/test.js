// @ts-check

import { strictEqual } from 'node:assert'

import trifidCore from 'trifid-core'
import { describe, it } from 'mocha'

import trifidPluginFactory from '../index.js'

/**
 * Get an endpoint of the Fastify Instance.
 *
 * @param {import('fastify').FastifyInstance} server Server.
 * @returns {string}
 */
const getListenerURL = (server) => {
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

describe('@zazuko/trifid-plugin-iiif', () => {
  describe('Trifid plugin', () => {
    it('should throw an error if no endpoint parameter is provided', async () => {
      try {
        await trifidPluginFactory({})
      } catch (e) {
        strictEqual(e.message, 'missing endpointUrl parameter')
      }
    })
  })

  describe('Trifid instance', () => {
    let trifidListener

    beforeEach(async () => {
      const trifidServer = await trifidCore(
        {
          server: {
            listener: {
              port: 0,
            },
            logLevel: 'warn',
          },
        },
        {
          iiif: {
            module: trifidPluginFactory,
            config: {
              endpointUrl: 'http://example.org/query',
            },
          },
        },
      )
      trifidListener = await trifidServer.start()
    })

    afterEach(async () => {
      await trifidListener.close()
    })

    it('should 404', async () => {
      const res = await fetch(`${getListenerURL(trifidListener)}/iiif/`)
      await res.text() // Just make sure that the stream is consumed
      strictEqual(res.status, 404)
    })

    it('can serve IIIF', async () => {
      const res = await fetch(`${getListenerURL(trifidListener)}/iiif/?uri=http://example.org/data`)
      await res.text() // Just make sure that the stream is consumed
      // @TODO: use a real SPARQL endpoint to get real results ; the 500 is due to the fact that the SPARQL endpoint is not real
      strictEqual(res.status, 500)
    })
  })
})
