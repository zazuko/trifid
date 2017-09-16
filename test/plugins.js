/* global describe, it */

const assert = require('assert')
const plugins = require('../lib/plugins')
const Promise = require('bluebird')

describe('plugins', () => {
  it('should be an object', () => {
    assert.equal(typeof plugins, 'object')
  })

  describe('.load', () => {
    it('should be a function', () => {
      assert.equal(typeof plugins.load, 'function')
    })

    it('should load plugin', () => {
      let touched = false

      const plugin = {
        name: 'dummy',
        func: () => {
          touched = true
        }
      }

      const config = {
        dummy: {}
      }

      return plugins.load([plugin], null, config).then(() => {
        assert(touched)
      })
    })

    it('should forward router', () => {
      let given

      const plugin = {
        name: 'dummy',
        func: (router) => {
          given = router
        }
      }

      const router = {}

      const config = {
        dummy: {}
      }

      return plugins.load([plugin], router, config).then(() => {
        assert.equal(given, router)
      })
    })

    it('should forward config', () => {
      let given

      const plugin = {
        name: 'dummy',
        func: (router, config) => {
          given = config
        }
      }

      const config = {
        dummy: {
          test: true
        }
      }

      return plugins.load([plugin], null, config).then(() => {
        assert(given, config.dummy)
      })
    })

    it('should forward plugin', () => {
      let given

      const plugin = {
        name: 'dummy',
        func: (router, config, plugin) => {
          given = plugin
        }
      }

      const config = {
        dummy: {
          test: true
        }
      }

      return plugins.load([plugin], null, config).then(() => {
        assert(given, plugin)
      })
    })

    it('should load plugins in serial sequence', () => {
      const sequence = []

      const plugin0 = {
        name: 'dummy0',
        func: () => {
          return Promise.delay(200).then(() => {
            sequence.push(0)
          })
        }
      }

      const plugin1 = {
        name: 'dummy1',
        func: () => {
          return Promise.delay(100).then(() => {
            sequence.push(1)
          })
        }
      }

      const config = {
        dummy0: {},
        dummy1: {}
      }

      return plugins.load([plugin0, plugin1], null, config).then(() => {
        assert.deepEqual(sequence, [0, 1])
      })
    })
  })

  describe('.middleware', () => {
    it('should be a function', () => {
      assert.equal(typeof plugins.middleware, 'function')
    })

    it('should create middleware with .apply if params are given', () => {
      let params

      const plugin = {
        middleware: (a, b) => {
          params = [a, b]
        },
        params: [0, 1]
      }

      const router = {
        use: () => {}
      }

      plugins.middleware(router, null, plugin)

      assert.deepEqual(params, [0, 1])
    })

    it('should create middleware with .call and forward config if no params are given', () => {
      let params

      const plugin = {
        middleware: (config) => {
          params = config
        }
      }

      const config = {
        a: 0,
        b: 1
      }

      const router = {
        use: () => {}
      }

      plugins.middleware(router, config, plugin)

      assert.equal(params, config)
    })
  })
})
