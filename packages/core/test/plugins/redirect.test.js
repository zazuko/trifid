// @ts-check

import { describe, it } from 'node:test'
import { strictEqual } from 'node:assert'

import trifidCore, { getListenerURL, assertRejection } from '../../index.js'

import redirectPlugin from '../../plugins/redirect.js'

const createTrifidInstance = async (config) => {
  return await trifidCore({
    server: {
      listener: {
        port: 0,
      },
      logLevel: 'warn',
    },
  }, {
    redirect: {
      module: redirectPlugin,
      paths: ['/redirect'],
      config,
    },
  })
}

describe('redirect plugin', () => {
  it('should throw if the target parameter is not set', () => {
    // @ts-expect-error
    assertRejection(redirectPlugin({ config: {}, logger: { debug: (/** @type {any} */ _) => { } } }))
  })

  it('should redirect request', async () => {
    const trifidInstance = await createTrifidInstance({ target: '/' })
    const trifidListener = await trifidInstance.start()
    const pluginUrl = `${getListenerURL(trifidListener)}/redirect`
    const response = await fetch(pluginUrl, { redirect: 'manual' })
    await trifidListener.close()

    strictEqual(response.status, 302)
  })

  it('should not redirect request', async () => {
    const trifidInstance = await createTrifidInstance({ target: '/' })
    const trifidListener = await trifidInstance.start()
    const pluginUrl = `${getListenerURL(trifidListener)}/non-existant-route`
    const response = await fetch(pluginUrl, { redirect: 'manual' })
    await trifidListener.close()

    strictEqual(response.status, 404)
  })
})
