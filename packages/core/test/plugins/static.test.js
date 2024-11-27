// @ts-check

import { describe, it } from 'node:test'
import { strictEqual } from 'node:assert'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import trifidCore, { getListenerURL, assertRejection } from '../../index.js'

import staticPlugin from '../../plugins/static.js'

const currentDir = dirname(fileURLToPath(import.meta.url))

const createTrifidInstance = async (config, paths) => {
  return await trifidCore({
    server: {
      listener: {
        port: 0,
      },
      logLevel: 'warn',
    },
  }, {
    redirect: {
      module: staticPlugin,
      paths,
      config,
    },
  })
}

describe('redirect plugin', () => {
  it('should throw if the directory parameter is not set', async () => {
    return assertRejection(createTrifidInstance({}, []))
  })

  it('should serve the specified resource (no path configured)', async () => {
    const trifidInstance = await createTrifidInstance({ directory: `${currentDir}/../support/` }, [])
    const trifidListener = await trifidInstance.start()
    const pluginUrl = `${getListenerURL(trifidListener)}/test.txt`
    const response = await fetch(pluginUrl)
    const responseText = await response.text()
    await trifidListener.close()

    const contentType = response.headers.get('content-type') || ''

    strictEqual(response.status, 200)
    strictEqual(contentType.split(';')[0], 'text/plain')
    strictEqual(responseText.trim(), 'some text')
  })

  it('should serve the specified resource (custom path configured)', async () => {
    const trifidInstance = await createTrifidInstance({ directory: `${currentDir}/../support/` }, ['/static/'])
    const trifidListener = await trifidInstance.start()
    const pluginUrl = `${getListenerURL(trifidListener)}/static/test.txt`
    const response = await fetch(pluginUrl)
    const responseText = await response.text()
    await trifidListener.close()

    const contentType = response.headers.get('content-type') || ''

    strictEqual(response.status, 200)
    strictEqual(contentType.split(';')[0], 'text/plain')
    strictEqual(responseText.trim(), 'some text')
  })

  it('should return a 404 on non-existant resources', async () => {
    const trifidInstance = await createTrifidInstance({ directory: `${currentDir}/../support/` }, ['/static/'])
    const trifidListener = await trifidInstance.start()
    const pluginUrl = `${getListenerURL(trifidListener)}/static/test-not-exist.txt`
    const response = await fetch(pluginUrl)
    await trifidListener.close()

    strictEqual(response.status, 404)
  })
})
