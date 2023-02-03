import { strictEqual, throws } from 'assert'
import { dirname, resolve } from 'path'
import { fileURLToPath, URL } from 'url'
import fetch from 'nodeify-fetch'
import { describe, it } from 'mocha'
import withServer from './support/withServer.js'
import factory, { middleware as trifidPluginI18n } from '../index.js'

const currentDir = dirname(fileURLToPath(import.meta.url))

describe('trifid-plugin-i18n', () => {
  it('should be a function', () => {
    strictEqual(typeof trifidPluginI18n, 'function')
  })

  it('should add the .t method to to res to translate a string', async () => {
    await withServer(async (server) => {
      const middleware = trifidPluginI18n({
        locales: ['en', 'de'],
        defaultLocale: 'en',
        directory: resolve(currentDir, 'support/locales')
      })
      server.app.use(middleware)

      let t = null

      server.app.get('/', (_req, res, next) => {
        t = res.t

        next()
      })

      const baseUrl = await server.listen()
      await (await fetch(baseUrl)).text()

      strictEqual(typeof t, 'function')
    })
  })

  it('should translate the string in the default language', async () => {
    await withServer(async (server) => {
      const middleware = trifidPluginI18n({
        locales: ['en', 'de'],
        defaultLocale: 'en',
        directory: resolve(currentDir, 'support/locales')
      })
      server.app.use(middleware)

      server.app.get('/', (_req, res) => {
        res.end(`${res.t('test')}`)
      })

      const baseUrl = await server.listen()
      const content = await (await fetch(baseUrl)).text()

      strictEqual(content, 'test-en')
    })
  })

  it('should translate the string in the language given as query parameter', async () => {
    await withServer(async (server) => {
      const middleware = trifidPluginI18n({
        locales: ['en', 'de'],
        defaultLocale: 'en',
        directory: resolve(currentDir, 'support/locales')
      })
      server.app.use(middleware)

      server.app.get('/', (_req, res) => {
        res.end(`${res.t('test')}`)
      })

      const baseUrl = new URL(await server.listen())
      baseUrl.searchParams.append('lang', 'de')

      const content = await (await fetch(baseUrl)).text()

      strictEqual(content, 'test-de')
    })
  })

  it('should translate the string in the language given as cookie', async () => {
    await withServer(async (server) => {
      const middleware = trifidPluginI18n({
        locales: ['en', 'de'],
        defaultLocale: 'en',
        directory: resolve(currentDir, 'support/locales')
      })
      server.app.use(middleware)

      server.app.get('/', (_req, res) => {
        res.end(`${res.t('test')}`)
      })

      const baseUrl = await server.listen()
      const content = await (await fetch(baseUrl, {
        headers: {
          cookie: 'i18n=de'
        }
      })).text()

      strictEqual(content, 'test-de')
    })
  })

  it('should send a cookie if the language changed', async () => {
    await withServer(async (server) => {
      const middleware = trifidPluginI18n({
        locales: ['en', 'de'],
        defaultLocale: 'en',
        directory: resolve(currentDir, 'support/locales')
      })
      server.app.use(middleware)

      const baseUrl = new URL(await server.listen())
      baseUrl.searchParams.append('lang', 'de')

      const res = await fetch(baseUrl)

      strictEqual(res.headers.get('set-cookie').startsWith('i18n=de'), true)
    })
  })
})

describe('Trifid factory', () => {
  it('should be a function', () => {
    strictEqual(typeof factory, 'function')
  })

  it('should throw if no directory is defined', async () => {
    await withServer(async (server) => {
      throws(() => factory({
        config: {
          locales: ['en', 'de'],
          defaultLocale: 'en'
        }
      }))
    })
  })

  it('should work as expected', async () => {
    await withServer(async (server) => {
      const middleware = factory({
        config: {
          locales: ['en', 'de'],
          defaultLocale: 'en',
          directory: resolve(currentDir, 'support/locales')
        }
      })
      server.app.use(middleware)

      const baseUrl = new URL(await server.listen())
      baseUrl.searchParams.append('lang', 'de')

      const res = await fetch(baseUrl)

      strictEqual(res.headers.get('set-cookie').startsWith('i18n=de'), true)
    })
  })
})
