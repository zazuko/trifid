import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import healthMiddleware from '../../middlewares/health.js'
import staticMiddleware from '../../middlewares/static.js'
import localsMiddleware from '../../middlewares/locals.js'

const currentDir = dirname(fileURLToPath(import.meta.url))

const health = {
  module: healthMiddleware,
}

const templateStaticFiles = {
  module: staticMiddleware,
  paths: '/static/core',
  config: {
    directory: `${currentDir}/../../static`,
  },
}

const locals = {
  module: localsMiddleware,
  order: 11,
}

export default {
  health,
  templateStaticFiles,
  locals,
}
