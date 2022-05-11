import healthMiddleware from '../../middlewares/health.js'

const health = {
  paths: '/health',
  methods: 'GET',
  module: healthMiddleware
}

export default {
  health
}
