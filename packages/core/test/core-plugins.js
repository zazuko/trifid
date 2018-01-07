/* global describe */

describe('core-plugins', () => {
  require('./plugins/error-handler')
  require('./plugins/handler')
  require('./plugins/middleware')
  require('./plugins/redirects')
  require('./plugins/static-files')
})
