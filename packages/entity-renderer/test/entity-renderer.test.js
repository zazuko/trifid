// @ts-check

/* eslint-disable no-useless-catch */

import { strictEqual } from 'assert'
import { describe, it } from 'mocha'

import { createTrifidInstance } from '../examples/instance.js'
import { getListenerURL } from './support/utils.js'

const trifidConfigUrl = './examples/config/trifid.yaml'

describe('@zazuko/trifid-plugin-ckan', () => {
  describe('basic tests', () => {
    it('should create a middleware with factory and default options', async () => {
      const trifidInstance = await createTrifidInstance(trifidConfigUrl, 'warn')
      const trifidListener = await trifidInstance.start()
      trifidListener.close()
    })

    it('should be able to load a rendered entity', async () => {
      const trifidInstance = await createTrifidInstance(trifidConfigUrl, 'warn')
      const trifidListener = await trifidInstance.start()

      try {
        const entityUrl = `${getListenerURL(trifidListener)}/person/amy-farrah-fowler`
        const res = await fetch(entityUrl)
        strictEqual(res.status, 200)
        const resText = await res.text()
        strictEqual(resText.toLocaleLowerCase().includes('amy'), true)
      } catch (e) {
        throw e
      } finally {
        trifidListener.close()
      }
    })

    it('should be able to load a rendered entity using HTML', async () => {
      const trifidInstance = await createTrifidInstance(trifidConfigUrl, 'warn')
      const trifidListener = await trifidInstance.start()

      try {
        const entityUrl = `${getListenerURL(trifidListener)}/person/amy-farrah-fowler`
        const res = await fetch(entityUrl, {
          headers: {
            accept: 'text/html',
          },
        })
        strictEqual(res.status, 200)
        const resText = await res.text()
        strictEqual(resText.toLocaleLowerCase().includes('<html'), true)
        strictEqual(resText.toLocaleLowerCase().includes('amy'), true)
      } catch (e) {
        throw e
      } finally {
        trifidListener.close()
      }
    })

    it('should not render non-existant entity', async () => {
      const trifidInstance = await createTrifidInstance(trifidConfigUrl, 'warn')
      const trifidListener = await trifidInstance.start()

      try {
        const entityUrl = `${getListenerURL(trifidListener)}/person/someone-that-does-not-exist`
        const res = await fetch(entityUrl)
        strictEqual(res.status, 404)
      } catch (e) {
        throw e
      } finally {
        trifidListener.close()
      }
    })
  })
})
