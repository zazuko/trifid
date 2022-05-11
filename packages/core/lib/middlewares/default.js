import healthMiddleware from '../../middlewares/health.js'

const health = {
  paths: '/health',
  module: healthMiddleware
}

export default {
  health
}
