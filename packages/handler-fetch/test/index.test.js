// @ts-check

import { strictEqual } from 'node:assert'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, it } from 'mocha'
import trifidCore, { getListenerURL, assertRejection } from 'trifid-core'

import handlerFetchTrifidPlugin from '../index.js'

const currentDir = dirname(fileURLToPath(import.meta.url))

const createTrifidInstance = async (config) => {
  return await trifidCore({
    server: {
      listener: {
        port: 4242,
      },
      logLevel: 'warn',
    },
  }, {
    handlerFetch: {
      module: handlerFetchTrifidPlugin,
      config,
    },
  })
}

describe('trifid-handler-fetch', () => {
  describe('bad configuration', () => {
    it('should throw if there is no configuration', async () => {
      return assertRejection(createTrifidInstance())
    })
  })

  describe('basic tests', () => {
    it('should able to start', async () => {
      const trifidInstance = await createTrifidInstance({
        url: join(currentDir, 'support', 'data.ttl'),
        contentType: 'text/turtle',
        baseIri: 'http://example.com/',
        unionDefaultGraph: true,
      })
      let trifidListener

      try {
        trifidListener = await trifidInstance.start()
        throw new Error('should have thrown')
      } catch (e) {
        strictEqual(e.message, 'should have thrown')
      } finally {
        if (trifidListener) {
          await trifidListener.close()
        }
      }
    })

    it('should able to perform a simple GET query', async () => {
      const trifidInstance = await createTrifidInstance({
        url: join(currentDir, 'support', 'data.ttl'),
        contentType: 'text/turtle',
        baseIri: 'http://example.com/',
        unionDefaultGraph: true,
      })
      let trifidListener

      let errored = false

      try {
        trifidListener = await trifidInstance.start()

        const pluginUrl = `${getListenerURL(trifidListener)}/query?query=ASK%20%7B%20%3Fs%20%3Fp%20%3Fo%20%7D`
        const response = await fetch(pluginUrl)
        const jsonResponse = await response.json()
        strictEqual(jsonResponse.boolean, true)
      } catch (e) {
        errored = true
      } finally {
        if (trifidListener) {
          await trifidListener.close()
        }
      }

      strictEqual(errored, false)
    })
  })

  it('should able to perform a simple POST query', async () => {
    const trifidInstance = await createTrifidInstance({
      url: join(currentDir, 'support', 'data.ttl'),
      contentType: 'text/turtle',
      baseIri: 'http://example.com/',
      unionDefaultGraph: true,
    })
    let trifidListener

    let errored = false

    try {
      trifidListener = await trifidInstance.start()

      const pluginUrl = `${getListenerURL(trifidListener)}/query`
      const formData = new URLSearchParams()
      formData.append('query', 'ASK { ?s ?p ?o }')
      const response = await fetch(pluginUrl, {
        method: 'POST',
        body: formData,
      })
      const jsonResponse = await response.json()
      strictEqual(jsonResponse.boolean, true)
    } catch (e) {
      errored = true
    } finally {
      if (trifidListener) {
        await trifidListener.close()
      }
    }

    strictEqual(errored, false)
  })

  it('should able to perform a simple POST query (content as body)', async () => {
    const trifidInstance = await createTrifidInstance({
      url: join(currentDir, 'support', 'data.ttl'),
      contentType: 'text/turtle',
      baseIri: 'http://example.com/',
      unionDefaultGraph: true,
    })
    let trifidListener

    let errored = false

    try {
      trifidListener = await trifidInstance.start()

      const pluginUrl = `${getListenerURL(trifidListener)}/query`
      const response = await fetch(pluginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sparql-query',
        },
        body: 'ASK { ?s ?p ?o }',
      })
      const jsonResponse = await response.json()
      strictEqual(jsonResponse.boolean, true)
    } catch (e) {
      errored = true
    } finally {
      if (trifidListener) {
        await trifidListener.close()
      }
    }

    strictEqual(errored, false)
  })
})
