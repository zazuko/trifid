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

describe('trifid-plugin-spex', () => {
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
        spex: {
          module: trifidPluginFactory,
          config: {
            endpointUrl: '/test',
          },
        },
      },
    )
    trifidListener = await trifidServer.start()
  })

  afterEach(async () => {
    await trifidListener.close()
  })

  it('can serve SPEX', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/spex/`)
    await res.text() // Just make sure that the stream is consumed
    strictEqual(res.status, 200)
    strictEqual(res.redirected, false) // Should not redirect on this case
  })

  it('should redirect if trailing slash is missing', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/spex`)
    await res.text() // Just make sure that the stream is consumed
    strictEqual(res.status, 200) // The redirection should lead to a correct page
    strictEqual(res.redirected, true) // Check the redirection
  })

  it('should serve the static JavaScript file', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/spex/static/spex.umd.min.js`)
    await res.text() // Just make sure that the stream is consumed
    strictEqual(res.status, 200)
  })

  it('should serve the static CSS file', async () => {
    const res = await fetch(`${getListenerURL(trifidListener)}/spex/static/spex.css`)
    await res.text() // Just make sure that the stream is consumed
    strictEqual(res.status, 200)
  })
})
