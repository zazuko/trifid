// @ts-check

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import trifidCore from 'trifid-core'
import handlerFetch from 'trifid-handler-fetch'
import ckanTrifidPlugin from '../../src/index.js'

export { getListenerURL } from 'trifid-core'

const currentDir = dirname(fileURLToPath(import.meta.url))

export const createTrifidInstance = async ({ logLevel }) => {
  return await trifidCore({
    server: {
      listener: {
        port: 0,
      },
      logLevel,
    },
  }, {
    store: {
      module: handlerFetch,
      paths: ['/query'],
      methods: ['GET', 'POST'],
      config: {
        contentType: 'text/turtle',
        url: join(currentDir, 'data.ttl'),
        baseIri: 'http://example.com/',
        graphName: undefined, // as we use a turtle file, we don't need to specify a graph name
        unionDefaultGraph: true,
      },
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
