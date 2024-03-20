// @ts-check

import { strictEqual } from 'node:assert'

import trifidCore from 'trifid-core'
import { describe } from 'mocha'

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

describe('trifid-plugin-yasgui', () => {
  describe('trifidPluginFactory', () => {
    it('should throw if the catalog option is not an array', async () => {
      try {
        await trifidPluginFactory({ config: { catalog: 'not an array' } })
      } catch (err) {
        strictEqual(err.message, '"catalog" option must be an array')
      }
    })
  })

  describe('instance', () => {
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
          yasgui: {
            module: trifidPluginFactory,
          },
        },
      )
      trifidListener = await trifidServer.start()
    })

    afterEach(async () => {
      await trifidListener.close()
    })

    it('can serve YASGUI', async () => {
      const res = await fetch(`${getListenerURL(trifidListener)}/sparql/`)
      await res.text() // Just make sure that the stream is consumed
      strictEqual(res.status, 200)
    })

    it('should redirect if trailing slash is missing', async () => {
      const res = await fetch(`${getListenerURL(trifidListener)}/sparql`)
      await res.text() // Just make sure that the stream is consumed
      strictEqual(res.status, 200) // The redirection should lead to a correct page
      strictEqual(res.redirected, true) // Check the redirection
    })

    it('can serve static CSS style', async () => {
      const res = await fetch(`${getListenerURL(trifidListener)}/yasgui-dist/yasgui.min.css`)
      await res.text() // Just make sure that the stream is consumed
      strictEqual(res.status, 200)
    })

    it('can serve static JavaScript script', async () => {
      const res = await fetch(`${getListenerURL(trifidListener)}/yasgui-dist/yasgui.min.js`)
      await res.text() // Just make sure that the stream is consumed
      strictEqual(res.status, 200)
    })
  })
})
