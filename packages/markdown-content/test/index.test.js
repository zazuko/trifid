// @ts-check

import { strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

import trifidCore, { getListenerURL } from 'trifid-core'
import markdownContentTrifidPlugin from '../src/index.js'

const createTrifidInstance = async (config) => {
  return await trifidCore({
    server: {
      listener: {
        port: 4242,
      },
      logLevel: 'warn',
    },
  }, {
    markdownContent: {
      module: markdownContentTrifidPlugin,
      methods: ['GET'],
      config,
    },
  })
}

describe('@zazuko/trifid-markdown-content', () => {
  describe('bad configuration', () => {
    it('should not throw if there is no configuration', async () => {
      const trifidInstance = await createTrifidInstance()
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
  })

  describe('content with "fr" and "en" defined, no fallback (no "default.md" file)', () => {
    it('should display english content by default', async () => {
      const trifidInstance = await createTrifidInstance({
        entries: {
          default: {
            directory: './test/support/content/',
            mountPath: '/content',
          },
        },
      })
      const trifidListener = await trifidInstance.start()

      try {
        const pluginUrl = `${getListenerURL(trifidListener)}/content/test-entry/`

        const res = await fetch(pluginUrl)
        const body = await res.text()
        const match = body.match(/This is a test/) || false

        strictEqual(res.status, 200)
        strictEqual(match && match.length > 0, true)

        // eslint-disable-next-line no-useless-catch
      } catch (e) {
        throw e
      } finally {
        await trifidListener.close()
      }
    })

    it('should display the English version when lang=en', async () => {
      const trifidInstance = await createTrifidInstance({
        entries: {
          default: {
            directory: './test/support/content/',
            mountPath: '/content',
          },
        },
      })
      const trifidListener = await trifidInstance.start()

      try {
        const pluginUrl = `${getListenerURL(trifidListener)}/content/test-entry/?lang=en`

        const res = await fetch(pluginUrl)
        const body = await res.text()
        const match = body.match(/This is a test/) || false

        strictEqual(res.status, 200)
        strictEqual(match && match.length > 0, true)

        // eslint-disable-next-line no-useless-catch
      } catch (e) {
        throw e
      } finally {
        await trifidListener.close()
      }
    })

    it('should display the French version when lang=fr', async () => {
      const trifidInstance = await createTrifidInstance({
        entries: {
          default: {
            directory: './test/support/content/',
            mountPath: '/content',
          },
        },
      })
      const trifidListener = await trifidInstance.start()

      try {
        const pluginUrl = `${getListenerURL(trifidListener)}/content/test-entry/?lang=fr`

        const res = await fetch(pluginUrl)
        const body = await res.text()
        const match = body.match(/Ceci est un test/) || false

        strictEqual(res.status, 200)
        strictEqual(match && match.length > 0, true)

        // eslint-disable-next-line no-useless-catch
      } catch (e) {
        throw e
      } finally {
        await trifidListener.close()
      }
    })

    it('should display empty content if there is no "default.md" file when we request another language', async () => {
      const trifidInstance = await createTrifidInstance({
        entries: {
          default: {
            directory: './test/support/content/',
            mountPath: '/content',
          },
        },
      })
      const trifidListener = await trifidInstance.start()

      try {
        const pluginUrl = `${getListenerURL(trifidListener)}/content/test-entry/?lang=de`

        const res = await fetch(pluginUrl)
        const body = await res.text()
        const matchFR = body.match(/Ceci est un test/) || false
        const matchEN = body.match(/This is a test/) || false
        const matchDE = body.match(/Das ist ein Test/) || false

        strictEqual(res.status, 200)
        strictEqual(matchEN && matchEN.length > 0, false)
        strictEqual(matchFR && matchFR.length > 0, false)
        strictEqual(matchDE && matchDE.length > 0, false)

        // eslint-disable-next-line no-useless-catch
      } catch (e) {
        throw e
      } finally {
        await trifidListener.close()
      }
    })
  })

  describe('content with "fr" and "en" defined, with fallback (a "default.md" file exists)', () => {
    it('should display english content by default', async () => {
      const trifidInstance = await createTrifidInstance({
        entries: {
          default: {
            directory: './test/support/content/',
            mountPath: '/content',
          },
        },
      })
      const trifidListener = await trifidInstance.start()

      try {
        const pluginUrl = `${getListenerURL(trifidListener)}/content/test-entry-with-default/`

        const res = await fetch(pluginUrl)
        const body = await res.text()
        const match = body.match(/This is a test/) || false

        strictEqual(res.status, 200)
        strictEqual(match && match.length > 0, true)

        // eslint-disable-next-line no-useless-catch
      } catch (e) {
        throw e
      } finally {
        await trifidListener.close()
      }
    })

    it('should display the English version when lang=en', async () => {
      const trifidInstance = await createTrifidInstance({
        entries: {
          default: {
            directory: './test/support/content/',
            mountPath: '/content',
          },
        },
      })
      const trifidListener = await trifidInstance.start()

      try {
        const pluginUrl = `${getListenerURL(trifidListener)}/content/test-entry-with-default/?lang=en`

        const res = await fetch(pluginUrl)
        const body = await res.text()
        const match = body.match(/This is a test/) || false

        strictEqual(res.status, 200)
        strictEqual(match && match.length > 0, true)

        // eslint-disable-next-line no-useless-catch
      } catch (e) {
        throw e
      } finally {
        await trifidListener.close()
      }
    })

    it('should display the French version when lang=fr', async () => {
      const trifidInstance = await createTrifidInstance({
        entries: {
          default: {
            directory: './test/support/content/',
            mountPath: '/content',
          },
        },
      })
      const trifidListener = await trifidInstance.start()

      try {
        const pluginUrl = `${getListenerURL(trifidListener)}/content/test-entry-with-default/?lang=fr`

        const res = await fetch(pluginUrl)
        const body = await res.text()
        const match = body.match(/Ceci est un test/) || false

        strictEqual(res.status, 200)
        strictEqual(match && match.length > 0, true)

        // eslint-disable-next-line no-useless-catch
      } catch (e) {
        throw e
      } finally {
        await trifidListener.close()
      }
    })

    it('should display default content (default.md)', async () => {
      const trifidInstance = await createTrifidInstance({
        entries: {
          default: {
            directory: './test/support/content/',
            mountPath: '/content',
          },
        },
      })
      const trifidListener = await trifidInstance.start()

      try {
        const pluginUrl = `${getListenerURL(trifidListener)}/content/test-entry-with-default/?lang=de`

        const res = await fetch(pluginUrl)
        const body = await res.text()
        const match = body.match(/Das ist ein Test/) || false

        strictEqual(res.status, 200)
        strictEqual(match && match.length > 0, true)

        // eslint-disable-next-line no-useless-catch
      } catch (e) {
        throw e
      } finally {
        await trifidListener.close()
      }
    })
  })

  describe('features', () => {
    it('should use the configured classes', async () => {
      const trifidInstance = await createTrifidInstance({
        entries: {
          default: {
            directory: './test/support/content/',
            mountPath: '/content',
            classes: {
              h1: 'h1-class',
            },
          },
        },
      })
      const trifidListener = await trifidInstance.start()

      try {
        const pluginUrl = `${getListenerURL(trifidListener)}/content/test-entry/`

        const res = await fetch(pluginUrl)
        const body = await res.text()
        const match = body.match(/h1-class/) || false

        strictEqual(res.status, 200)
        strictEqual(match && match.length > 0, true)

        // eslint-disable-next-line no-useless-catch
      } catch (e) {
        throw e
      } finally {
        await trifidListener.close()
      }
    })

    it('should use the configured idPrefix', async () => {
      const trifidInstance = await createTrifidInstance({
        entries: {
          default: {
            directory: './test/support/content/',
            mountPath: '/content',
            idPrefix: 'custom-prefix-',
          },
        },
      })
      const trifidListener = await trifidInstance.start()

      try {
        const pluginUrl = `${getListenerURL(trifidListener)}/content/test-entry/?lang=en`

        const res = await fetch(pluginUrl)
        const body = await res.text()
        const match = body.match(/custom-prefix-title/) || false

        strictEqual(res.status, 200)
        strictEqual(match && match.length > 0, true)

        // eslint-disable-next-line no-useless-catch
      } catch (e) {
        throw e
      } finally {
        await trifidListener.close()
      }
    })

    it('should use the configured template', async () => {
      const trifidInstance = await createTrifidInstance({
        entries: {
          default: {
            directory: './test/support/content/',
            mountPath: '/content',
            template: './test/support/custom.hbs',
          },
        },
      })
      const trifidListener = await trifidInstance.start()

      try {
        const pluginUrl = `${getListenerURL(trifidListener)}/content/test-entry/`

        const res = await fetch(pluginUrl)
        const body = await res.text()
        const match = body.match(/This is using custom template/) || false

        strictEqual(res.status, 200)
        strictEqual(match && match.length > 0, true)

        // eslint-disable-next-line no-useless-catch
      } catch (e) {
        throw e
      } finally {
        await trifidListener.close()
      }
    })

    it('should use autoLink', async () => {
      const trifidInstance = await createTrifidInstance({
        entries: {
          default: {
            directory: './test/support/content/',
            mountPath: '/content',
            autoLink: true,
          },
        },
      })
      const trifidListener = await trifidInstance.start()

      try {
        const pluginUrl = `${getListenerURL(trifidListener)}/content/test-entry/?lang=en`

        const res = await fetch(pluginUrl)
        const body = await res.text()
        const match = body.match(/ href="#content-title"/) || false

        strictEqual(res.status, 200)
        strictEqual(match && match.length > 0, true)

        // eslint-disable-next-line no-useless-catch
      } catch (e) {
        throw e
      } finally {
        await trifidListener.close()
      }
    })

    it('should use autoLink and custom idPrefix', async () => {
      const trifidInstance = await createTrifidInstance({
        entries: {
          default: {
            directory: './test/support/content/',
            mountPath: '/content',
            autoLink: true,
            idPrefix: 'custom-prefix-',
          },
        },
      })
      const trifidListener = await trifidInstance.start()

      try {
        const pluginUrl = `${getListenerURL(trifidListener)}/content/test-entry/?lang=en`

        const res = await fetch(pluginUrl)
        const body = await res.text()
        const match = body.match(/ href="#custom-prefix-title"/) || false

        strictEqual(res.status, 200)
        strictEqual(match && match.length > 0, true)

        // eslint-disable-next-line no-useless-catch
      } catch (e) {
        throw e
      } finally {
        await trifidListener.close()
      }
    })

    it('should not insert links if autoLink=false', async () => {
      const trifidInstance = await createTrifidInstance({
        entries: {
          default: {
            directory: './test/support/content/',
            mountPath: '/content',
            autoLink: false,
          },
        },
      })
      const trifidListener = await trifidInstance.start()

      try {
        const pluginUrl = `${getListenerURL(trifidListener)}/content/test-entry/?lang=en`

        const res = await fetch(pluginUrl)
        const body = await res.text()
        const match = body.match(/ href="#content-title"/) || false

        strictEqual(res.status, 200)
        strictEqual(match && match.length > 0, false)

        // eslint-disable-next-line no-useless-catch
      } catch (e) {
        throw e
      } finally {
        await trifidListener.close()
      }
    })
  })

  describe('features, using defaults', () => {
    it('should use the configured classes', async () => {
      const trifidInstance = await createTrifidInstance({
        defaults: {
          classes: {
            h1: 'h1-class',
          },
        },
        entries: {
          default: {
            directory: './test/support/content/',
            mountPath: '/content',
          },
        },
      })
      const trifidListener = await trifidInstance.start()

      try {
        const pluginUrl = `${getListenerURL(trifidListener)}/content/test-entry/`

        const res = await fetch(pluginUrl)
        const body = await res.text()
        const match = body.match(/h1-class/) || false

        strictEqual(res.status, 200)
        strictEqual(match && match.length > 0, true)

        // eslint-disable-next-line no-useless-catch
      } catch (e) {
        throw e
      } finally {
        await trifidListener.close()
      }
    })

    it('should use the configured idPrefix', async () => {
      const trifidInstance = await createTrifidInstance({
        defaults: {
          idPrefix: 'custom-prefix-',
        },
        entries: {
          default: {
            directory: './test/support/content/',
            mountPath: '/content',
          },
        },
      })
      const trifidListener = await trifidInstance.start()

      try {
        const pluginUrl = `${getListenerURL(trifidListener)}/content/test-entry/?lang=en`

        const res = await fetch(pluginUrl)
        const body = await res.text()
        const match = body.match(/custom-prefix-title/) || false

        strictEqual(res.status, 200)
        strictEqual(match && match.length > 0, true)

        // eslint-disable-next-line no-useless-catch
      } catch (e) {
        throw e
      } finally {
        await trifidListener.close()
      }
    })

    it('should use the configured template', async () => {
      const trifidInstance = await createTrifidInstance({
        defaults: {
          template: './test/support/custom.hbs',
        },
        entries: {
          default: {
            directory: './test/support/content/',
            mountPath: '/content',
          },
        },
      })
      const trifidListener = await trifidInstance.start()

      try {
        const pluginUrl = `${getListenerURL(trifidListener)}/content/test-entry/`

        const res = await fetch(pluginUrl)
        const body = await res.text()
        const match = body.match(/This is using custom template/) || false

        strictEqual(res.status, 200)
        strictEqual(match && match.length > 0, true)

        // eslint-disable-next-line no-useless-catch
      } catch (e) {
        throw e
      } finally {
        await trifidListener.close()
      }
    })

    it('should use autoLink', async () => {
      const trifidInstance = await createTrifidInstance({
        defaults: {
          autoLink: true,
        },
        entries: {
          default: {
            directory: './test/support/content/',
            mountPath: '/content',
          },
        },
      })
      const trifidListener = await trifidInstance.start()

      try {
        const pluginUrl = `${getListenerURL(trifidListener)}/content/test-entry/?lang=en`

        const res = await fetch(pluginUrl)
        const body = await res.text()
        const match = body.match(/ href="#content-title"/) || false

        strictEqual(res.status, 200)
        strictEqual(match && match.length > 0, true)

        // eslint-disable-next-line no-useless-catch
      } catch (e) {
        throw e
      } finally {
        await trifidListener.close()
      }
    })

    it('should use autoLink and custom idPrefix', async () => {
      const trifidInstance = await createTrifidInstance({
        defaults: {
          autoLink: true,
          idPrefix: 'custom-prefix-',
        },
        entries: {
          default: {
            directory: './test/support/content/',
            mountPath: '/content',
          },
        },
      })
      const trifidListener = await trifidInstance.start()

      try {
        const pluginUrl = `${getListenerURL(trifidListener)}/content/test-entry/?lang=en`

        const res = await fetch(pluginUrl)
        const body = await res.text()
        const match = body.match(/ href="#custom-prefix-title"/) || false

        strictEqual(res.status, 200)
        strictEqual(match && match.length > 0, true)

        // eslint-disable-next-line no-useless-catch
      } catch (e) {
        throw e
      } finally {
        await trifidListener.close()
      }
    })

    it('should not insert links if autoLink=false', async () => {
      const trifidInstance = await createTrifidInstance({
        defaults: {
          autoLink: false,
        },
        entries: {
          default: {
            directory: './test/support/content/',
            mountPath: '/content',
          },
        },
      })
      const trifidListener = await trifidInstance.start()

      try {
        const pluginUrl = `${getListenerURL(trifidListener)}/content/test-entry/?lang=en`

        const res = await fetch(pluginUrl)
        const body = await res.text()
        const match = body.match(/ href="#content-title"/) || false

        strictEqual(res.status, 200)
        strictEqual(match && match.length > 0, false)

        // eslint-disable-next-line no-useless-catch
      } catch (e) {
        throw e
      } finally {
        await trifidListener.close()
      }
    })
  })
})
