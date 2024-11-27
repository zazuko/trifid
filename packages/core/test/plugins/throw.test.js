// @ts-check

import { describe, it } from 'node:test'
import { strictEqual } from 'node:assert'

import trifidCore, { getListenerURL } from '../../index.js'

import throwPlugin from '../../plugins/throw.js'

const createTrifidInstance = async (config) => {
  return await trifidCore({
    server: {
      listener: {
        port: 0,
      },
      logLevel: 'warn',
    },
  }, {
    throw: {
      module: throwPlugin,
      paths: ['/throw'],
      config,
    },
  })
}

describe('throw plugin', () => {
  it('should throw using the default configuration', async () => {
    const trifidInstance = await createTrifidInstance({})
    const trifidListener = await trifidInstance.start()
    const pluginUrl = `${getListenerURL(trifidListener)}/throw`
    const response = await fetch(pluginUrl)
    await trifidListener.close()

    strictEqual(response.status, 500)
  })

  it('should allow a custom message', async () => {
    const trifidInstance = await createTrifidInstance({
      message: 'This is a custom error message',
    })
    const trifidListener = await trifidInstance.start()
    const pluginUrl = `${getListenerURL(trifidListener)}/throw`
    const response = await fetch(pluginUrl)
    await trifidListener.close()

    strictEqual(response.status, 500)
  })
})
