// @ts-check

import { describe, it } from 'node:test'
import { strictEqual, match } from 'node:assert'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import trifidCore, { assertRejection, getListenerURL } from '../../index.js'

import viewPlugin from '../../plugins/view.js'

const currentDir = dirname(fileURLToPath(import.meta.url))

const createTrifidInstance = async (config) => {
  return await trifidCore({
    server: {
      listener: {
        port: 0,
      },
      logLevel: 'warn',
    },
  }, {
    view: {
      module: viewPlugin,
      paths: ['/view'],
      config,
    },
  })
}

describe('view plugin', () => {
  it('should throw if the path parameter is not set', () => {
    // @ts-expect-error
    assertRejection(viewPlugin({}))
  })

  it('should throw if the path parameter is set to an empty string', () => {
    assertRejection(viewPlugin({
      // @ts-expect-error
      path: '',
    }))
  })

  it('should throw if the file does not exist', async () => {
    const trifidInstance = await createTrifidInstance({
      path: 'non-existant-file',
    })
    const trifidListener = await trifidInstance.start()
    const pluginUrl = `${getListenerURL(trifidListener)}/view`
    const response = await fetch(pluginUrl)
    await trifidListener.close()

    strictEqual(response.status, 500)
  })

  it('should work with a basic template', async () => {
    const trifidInstance = await createTrifidInstance({
      path: join(currentDir, '..', 'support', 'plugins', 'view', 'basic.hbs'),
    })
    const trifidListener = await trifidInstance.start()
    const pluginUrl = `${getListenerURL(trifidListener)}/view`
    const response = await fetch(pluginUrl)
    await trifidListener.close()
    const text = await response.text()
    match(text, /Hello world!/)

    strictEqual(response.status, 200)
  })

  it('should forward the context', async () => {
    const trifidInstance = await createTrifidInstance({
      path: join(currentDir, '..', 'support', 'plugins', 'view', 'context.hbs'),
      context: {
        data: 'Hello world!',
      },
    })
    const trifidListener = await trifidInstance.start()
    const pluginUrl = `${getListenerURL(trifidListener)}/view`
    const response = await fetch(pluginUrl)
    await trifidListener.close()
    const text = await response.text()
    match(text, /Template: Hello world!/)

    strictEqual(response.status, 200)
  })

  it('should be able to set a custom title', async () => {
    const trifidInstance = await createTrifidInstance({
      path: join(currentDir, '..', 'support', 'plugins', 'view', 'context.hbs'),
      options: {
        title: 'Hello world!',
      },
    })
    const trifidListener = await trifidInstance.start()
    const pluginUrl = `${getListenerURL(trifidListener)}/view`
    const response = await fetch(pluginUrl)
    await trifidListener.close()
    const text = await response.text()
    match(text.toLowerCase(), /<title>hello world!<\/title>/)
    match(text, /Hello world!/)

    strictEqual(response.status, 200)
  })

  it('should be able to set a custom title and set context', async () => {
    const trifidInstance = await createTrifidInstance({
      path: join(currentDir, '..', 'support', 'plugins', 'view', 'context.hbs'),
      options: {
        title: 'Custom Title',
      },
      context: {
        data: 'Hello world!',
      },
    })
    const trifidListener = await trifidInstance.start()
    const pluginUrl = `${getListenerURL(trifidListener)}/view`
    const response = await fetch(pluginUrl)
    await trifidListener.close()
    const text = await response.text()
    match(text.toLowerCase(), /<title>custom title<\/title>/)
    match(text, /Custom Title/)
    match(text, /Template: Hello world!/)

    strictEqual(response.status, 200)
  })
})
