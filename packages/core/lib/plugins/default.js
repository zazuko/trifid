import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import healthPlugin from '../../plugins/health.js'
import staticPlugin from '../../plugins/static.js'
import localsPlugin from '../../plugins/locals.js'

const currentDir = dirname(fileURLToPath(import.meta.url))

const health = {
  module: healthPlugin,
}

const templateStaticFiles = {
  module: staticPlugin,
  paths: '/static/core',
  config: {
    directory: `${currentDir}/../../static`,
  },
}

const locals = {
  module: localsPlugin,
  order: 11,
}

export default {
  health,
  templateStaticFiles,
  locals,
}
