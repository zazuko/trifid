// @ts-check
import { strictEqual } from 'assert'
import { readFile } from 'fs/promises'
import { describe, it } from 'mocha'

import trifidCore from 'trifid-core'
import ckanTrifidPlugin from '../src/index.js'
import { storeMiddleware } from './support/store.js'
import { getListenerURL } from './support/utils.js'

const createTrifidInstance = async () => {
  return await trifidCore({
    server: {
      listener: {
        port: 4242,
      },
      logLevel: 'warn',
    },
  }, {
    store: {
      module: storeMiddleware,
      paths: ['/query'],
      methods: ['GET', 'POST'],
    },
    ckan: {
      module: ckanTrifidPlugin,
      paths: ['/ckan'],
      methods: ['GET'],
      config: {
        endpointUrl: '/query',
      },
    },
  })
}

describe('@zazuko/trifid-plugin-ckan', () => {
  describe('basic tests', () => {
    it('should create a middleware with factory and default options', async () => {
      const trifidInstance = await createTrifidInstance()
      const trifidListener = await trifidInstance.start()
      trifidListener.close()
    })

    it('should answer with a 400 status code if the organization parameter is missing', async () => {
      const trifidInstance = await createTrifidInstance()
      const trifidListener = await trifidInstance.start()
      const ckanUrl = `${getListenerURL(trifidListener)}/ckan`

      const res = await fetch(ckanUrl)
      strictEqual(res.status, 400)
      trifidListener.close()
    })

    it('should get an empty result for an unknown organization', async () => {
      const trifidInstance = await createTrifidInstance()
      const trifidListener = await trifidInstance.start()
      const ckanUrl = `${getListenerURL(trifidListener)}/ckan?organization=http://example.com/unkown-org`

      const res = await fetch(ckanUrl)
      const body = await res.text()
      const expectedResult = await readFile(new URL('./support/empty-result.xml', import.meta.url), 'utf8')

      strictEqual(res.status, 200)
      strictEqual(body, expectedResult)

      trifidListener.close()
    })

    it('should get a basic result for a known organization', async () => {
      const trifidInstance = await createTrifidInstance()
      const trifidListener = await trifidInstance.start()
      const ckanUrl = `${getListenerURL(trifidListener)}/ckan?organization=http://example.com/my-org`

      const res = await fetch(ckanUrl)
      const body = await res.text()
      const expectedResult = await readFile(new URL('./support/basic-result.xml', import.meta.url), 'utf8')

      strictEqual(res.status, 200)
      strictEqual(body, expectedResult)

      trifidListener.close()
    })
  })
})
