// @ts-check
import { dirname, join as pathJoin } from 'node:path'
import { fileURLToPath } from 'node:url'

import fastifyView from '@fastify/view'
import Handlebars from 'handlebars'

const trifidRootPath = dirname(dirname(fileURLToPath(import.meta.url)))

/** @type {import('@fastify/view').default} */
const plugin = fastifyView

/** @type {import('@fastify/view').FastifyViewOptions} */
const pluginOptions = {
  engine: {
    handlebars: Handlebars,
  },
  root: pathJoin(trifidRootPath, 'views'),
  layout: './layouts/main',
  includeViewExtension: true,
  viewExt: 'hbs',
  propertyName: 'view',
  defaultContext: {
    dev: process.env.NODE_ENV === 'development',
  },
  options: {},
}

/** @type {import('../types/plugin.d.ts').TrifidPlugin} */
const trifidPlugin = async () => {
  return {
    plugin,
    pluginOptions,
  }
}
export default trifidPlugin
