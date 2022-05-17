import healthMiddleware from '../../middlewares/health.js'
import errorsMiddleware from '../../middlewares/errors.js'
import notFoundMiddleware from '../../middlewares/notFound.js'

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

export default {
  health,
  errors,
  notFound
}
