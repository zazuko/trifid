import healthMiddleware from '../../middlewares/health.js'
import errorsMiddleware from '../../middlewares/errors.js'

const health = {
  paths: '/health',
  methods: 'GET',
  module: healthMiddleware
}

const errors = {
  module: errorsMiddleware,
  order: 1000
}

export default {
  health,
  errors
}
