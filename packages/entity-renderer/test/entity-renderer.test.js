// @ts-check

import { strictEqual } from 'node:assert'
import { describe, it, beforeEach, afterEach } from 'node:test'
import { getListenerURL } from 'trifid-core'

import { createTrifidInstance } from '../examples/instance.js'

const trifidConfigUrl = './examples/config/trifid.yaml'

describe('@zazuko/trifid-entity-renderer', () => {
  let trifidListener

  describe('basic tests', () => {
    beforeEach(async () => {
      const trifidInstance = await createTrifidInstance(trifidConfigUrl, 'warn')
      trifidListener = await trifidInstance.start()
    })

    afterEach(async () => {
      await trifidListener.close()
    })

    it('should be able to load a rendered entity', async () => {
      const entityUrl = `${getListenerURL(trifidListener)}/person/amy-farrah-fowler`
      const res = await fetch(entityUrl)
      strictEqual(res.status, 200)
      const resText = await res.text()
      strictEqual(resText.toLocaleLowerCase().includes('amy'), true)
    })

    it('should be able to load a rendered entity using HTML', async () => {
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
    })

    it('should not render non-existant entity', async () => {
      const entityUrl = `${getListenerURL(trifidListener)}/person/someone-that-does-not-exist`
      const res = await fetch(entityUrl)
      strictEqual(res.status, 404)
    })
  })

  describe('enableSchemaUrlRedirect', () => {
    describe('enabled', () => {
      beforeEach(async () => {
        const trifidInstance = await createTrifidInstance(trifidConfigUrl, 'warn', {
          enableSchemaUrlRedirect: true,
        })
        trifidListener = await trifidInstance.start()
      })

      afterEach(async () => {
        await trifidListener.close()
      })

      it('should not redirect for non-html content', async () => {
        const entityUrl = `${getListenerURL(trifidListener)}/test/shouldRedirect`
        const res = await fetch(entityUrl, { redirect: 'manual' })
        strictEqual(res.status, 200)
      })

      it('should redirect for html content', async () => {
        const entityUrl = `${getListenerURL(trifidListener)}/test/shouldRedirect`
        const res = await fetch(entityUrl, {
          headers: {
            accept: 'text/html',
          },
          redirect: 'manual',
        })
        strictEqual(res.status, 302)
        const location = res.headers.get('location')
        strictEqual(location, 'http://example.com/')
      })

      it('should not redirect when disableSchemaUrlRedirect=true', async () => {
        const entityUrl = `${getListenerURL(trifidListener)}/test/shouldRedirect?disableSchemaUrlRedirect=true`
        const res = await fetch(entityUrl, {
          headers: {
            accept: 'text/html',
          },
          redirect: 'manual',
        })
        strictEqual(res.status, 200)
      })

      it('should not redirect when x-disable-schema-url-redirect=true', async () => {
        const entityUrl = `${getListenerURL(trifidListener)}/test/shouldRedirect`
        const res = await fetch(entityUrl, {
          headers: {
            accept: 'text/html',
            'x-disable-schema-url-redirect': 'true',
          },
          redirect: 'manual',
        })
        strictEqual(res.status, 200)
      })

      it('should not redirect when the value is not an xsd:anyURI', async () => {
        const entityUrl = `${getListenerURL(trifidListener)}/test/shouldNotRedirect`
        const res = await fetch(entityUrl, {
          headers: {
            accept: 'text/html',
          },
          redirect: 'manual',
        })
        strictEqual(res.status, 200)
      })
    })
  })
})
