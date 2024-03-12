// @ts-check

import { strictEqual } from 'node:assert'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import trifidCore from 'trifid-core'
import { describe } from 'mocha'

import trifidPluginFactory from '../index.js'

const currentDir = dirname(fileURLToPath(import.meta.url))

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

const createTrifidInstance = (config) => {
  return trifidCore(
    {
      server: {
        listener: {
          port: 0,
        },
        logLevel: 'warn',
      },
    },
    {
      i18n: {
        module: trifidPluginFactory,
        config,
      },
      testPage: {
        module: async () => {
          return {
            defaultConfiguration: async () => {
              return {
                methods: ['GET'],
                paths: [
                  '/',
                ],
              }
            },
            routeHandler: async () => {
              /**
               * Route handler.
               * @param {import('fastify').FastifyRequest & { session: Map<string, any> }} request Request.
               * @param {import('fastify').FastifyReply} reply Reply.
               */
              const handler = async (request, reply) => {
                const session = request.session
                reply.send(session.get('t')('test'))
              }
              return handler
            },
          }
        },
      },
    },
  )
}

describe('trifid-plugin-i18n', () => {
  let trifidListener

  afterEach(async () => {
    if (!trifidListener) {
      return
    }
    await trifidListener.close()
    trifidListener = undefined
  })

  it('should throw if no directory is defined', async () => {
    try {
      await createTrifidInstance({})
    } catch (error) {
      strictEqual(error.message, "The 'directory' configuration field should be a non-empty string.")
    }
  })

  it('should work with EN as default locale', async () => {
    const trifidInstance = await createTrifidInstance({
      locales: ['en', 'fr', 'de'],
      defaultLocale: 'en',
      directory: resolve(currentDir, 'support/locales'),
    })
    trifidListener = await trifidInstance.start()
    const res = await fetch(`${getListenerURL(trifidListener)}/`)
    const body = await res.text()
    strictEqual(res.status, 200)
    strictEqual(body, 'test-en')
  })

  it('should work with DE as default locale (should return EN)', async () => {
    const trifidInstance = await createTrifidInstance({
      locales: ['en', 'fr', 'de'],
      defaultLocale: 'de',
      directory: resolve(currentDir, 'support/locales'),
    })
    trifidListener = await trifidInstance.start()
    const res = await fetch(`${getListenerURL(trifidListener)}/`)
    const body = await res.text()
    strictEqual(res.status, 200)
    strictEqual(body, 'test-en')
  })

  it('should set a cookie in case the language changed', async () => {
    const trifidInstance = await createTrifidInstance({
      locales: ['en', 'fr', 'de'],
      defaultLocale: 'en',
      directory: resolve(currentDir, 'support/locales'),
    })
    trifidListener = await trifidInstance.start()
    const res = await fetch(`${getListenerURL(trifidListener)}/?lang=fr`)
    const cookies = res.headers.get('set-cookie') || ''
    strictEqual(cookies.startsWith('i18n=fr'), true)
    const body = await res.text() // Just make sure that the stream is consumed
    strictEqual(res.status, 200)
    strictEqual(body, 'test-fr')
  })

  it('should use the language from the cookie', async () => {
    const trifidInstance = await createTrifidInstance({
      locales: ['en', 'fr', 'de'],
      defaultLocale: 'en',
      directory: resolve(currentDir, 'support/locales'),
    })
    trifidListener = await trifidInstance.start()
    const res = await fetch(`${getListenerURL(trifidListener)}/`, {
      headers: {
        cookie: 'i18n=fr',
      },
    })
    const body = await res.text()
    strictEqual(res.status, 200)
    strictEqual(body, 'test-fr')
  })

  it('should override cookie value if language is specified in query parameter', async () => {
    const trifidInstance = await createTrifidInstance({
      locales: ['en', 'fr', 'de'],
      defaultLocale: 'en',
      directory: resolve(currentDir, 'support/locales'),
    })
    trifidListener = await trifidInstance.start()
    const res = await fetch(`${getListenerURL(trifidListener)}/?lang=fr`, {
      headers: {
        cookie: 'i18n=de',
      },
    })
    const cookies = res.headers.get('set-cookie') || ''
    strictEqual(cookies.startsWith('i18n=fr'), true)
    const body = await res.text()
    strictEqual(res.status, 200)
    strictEqual(body, 'test-fr')
  })
})
