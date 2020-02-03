const { strictEqual } = require('assert')
const { resolve } = require('path')
const { URL } = require('url')
const fetch = require('nodeify-fetch')
const { describe, it } = require('mocha')
const withServer = require('./support/withServer')
const trifidPluginI18n = require('..')

describe('trifid-plugin-i18n', () => {
  it('should be a function', () => {
    strictEqual(typeof trifidPluginI18n, 'function')
  })

  it('should add the .t method to to res to translate a string', async () => {
    await withServer(async server => {
      trifidPluginI18n(server.app, {
        locales: ['en', 'de'],
        defaultLocale: 'en',
        directory: resolve(__dirname, 'support/locales')
      })

      let t = null

      server.app.get('/', (req, res, next) => {
        t = res.t

        next()
      })

      const baseUrl = await server.listen()
      await (await fetch(baseUrl)).text()

      strictEqual(typeof t, 'function')
    })
  })

  it('should translate the string in the default language', async () => {
    await withServer(async server => {
      trifidPluginI18n(server.app, {
        locales: ['en', 'de'],
        defaultLocale: 'en',
        directory: resolve(__dirname, 'support/locales')
      })

      server.app.get('/', (req, res) => {
        res.end(`${res.t('test')}`)
      })

      const baseUrl = await server.listen()
      const content = await (await fetch(baseUrl)).text()

      strictEqual(content, 'test-en')
    })
  })

  it('should translate the string in the language given as query parameter', async () => {
    await withServer(async server => {
      trifidPluginI18n(server.app, {
        locales: ['en', 'de'],
        defaultLocale: 'en',
        directory: resolve(__dirname, 'support/locales')
      })

      server.app.get('/', (req, res) => {
        res.end(`${res.t('test')}`)
      })

      const baseUrl = new URL(await server.listen())
      baseUrl.searchParams.append('lang', 'de')

      const content = await (await fetch(baseUrl)).text()

      strictEqual(content, 'test-de')
    })
  })

  it('should translate the string in the language given as cookie', async () => {
    await withServer(async server => {
      trifidPluginI18n(server.app, {
        locales: ['en', 'de'],
        defaultLocale: 'en',
        directory: resolve(__dirname, 'support/locales')
      })

      server.app.get('/', (req, res) => {
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
    await withServer(async server => {
      trifidPluginI18n(server.app, {
        locales: ['en', 'de'],
        defaultLocale: 'en',
        directory: resolve(__dirname, 'support/locales')
      })

      const baseUrl = new URL(await server.listen())
      baseUrl.searchParams.append('lang', 'de')

      const res = await fetch(baseUrl)

      strictEqual(res.headers.get('set-cookie').startsWith('i18n=de'), true)
    })
  })
})
