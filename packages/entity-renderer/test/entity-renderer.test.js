// @ts-check

/* eslint-disable no-useless-catch */

import { strictEqual } from 'assert'
import { describe, it, beforeEach, afterEach } from 'mocha'

import { createTrifidInstance } from '../examples/instance.js'
import { getListenerURL } from './support/utils.js'

const trifidConfigUrl = './examples/config/trifid.yaml'

describe('@zazuko/trifid-entity-renderer', async () => {
  let trifidListener

  beforeEach(async () => {
    const trifidInstance = await createTrifidInstance(trifidConfigUrl, 'warn')
    trifidListener = await trifidInstance.start()
  })

  afterEach(async () => {
    await trifidListener.close()
  })

  describe('basic tests', () => {
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
})
