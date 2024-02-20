import { dirname } from 'path'
import { fileURLToPath } from 'url'

import healthMiddleware from '../../middlewares/health.js'
import staticMiddleware from '../../middlewares/static.js'
import iriMiddleware from '../../middlewares/iri.js'
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

const iri = {
  module: iriMiddleware,
  order: 10,
}

const locals = {
  module: localsMiddleware,
  order: 11,
}

export default {
  health,
  templateStaticFiles,
  // iri,
  // locals,
}
