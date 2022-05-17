import { dirname } from 'path'
import { fileURLToPath } from 'url'

import healthMiddleware from '../../middlewares/health.js'
import errorsMiddleware from '../../middlewares/errors.js'
import notFoundMiddleware from '../../middlewares/notFound.js'
import staticMiddleware from '../../middlewares/static.js'

const currentDir = dirname(fileURLToPath(import.meta.url))

const health = {
  paths: '/health',
  methods: 'GET',
  module: healthMiddleware
}

const errors = {
  module: errorsMiddleware,
  order: 1200
}

const notFound = {
  module: notFoundMiddleware,
  order: 1100
}

const templateStaticFiles = {
  module: staticMiddleware,
  paths: '/static/core',
  config: {
    directory: `${currentDir}/../../static`
  }
}

export default {
  health,
  errors,
  notFound,
  templateStaticFiles
}
