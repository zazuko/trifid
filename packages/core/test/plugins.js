/* global describe, it */

const assert = require('assert')
const path = require('path')
const plugins = require('../lib/plugins')

describe('plugins', () => {
  it('should be an object', () => {
    assert.equal(typeof plugins, 'object')
  })

  describe('.prepare', () => {
    it('should be a function', () => {
      assert.equal(typeof plugins.prepare, 'function')
    })

    it('should convert an object to an array with key as .name property', () => {
      const list = {
        test0: {
          property0: '0'
        },
        test1: {
          property1: '1'
        }
      }

      const expected = [{
        name: 'test0',
        property0: '0'
      }, {
        name: 'test1',
        property1: '1'
      }]

      const actual = plugins.prepare(list)

      assert.deepEqual(actual, expected)
    })

    it('should sort the results by the value of the .priority property', () => {
      const list = {
        test0: {
          property0: '0',
          priority: 30
        },
        test1: {
          property1: '1',
          priority: 10
        },
        test2: {
          property2: '2',
          priority: 20
        }
      }

      const expected = [{
        name: 'test1',
        property1: '1',
        priority: 10
      }, {
        name: 'test2',
        property2: '2',
        priority: 20
      }, {
        name: 'test0',
        property0: '0',
        priority: 30
      }]

      const actual = plugins.prepare(list)

      assert.deepEqual(actual, expected)
    })
  })

  describe('.load', () => {
    it('should be a function', () => {
      assert.equal(typeof plugins.load, 'function')
    })

    it('should load the given plugin', () => {
      let touched = false

      const list = {
        dummy: {
          module: path.join(__dirname, 'support/dummy-plugin')
        }
      }

      const router = {
        callback: () => {
          touched = true
        }
      }

      return plugins.load(list, router, {}).then(() => {
        assert(touched)
      })
    })

    it('should forward the router', () => {
      let forwardedRouter

      const list = {
        dummy: {
          module: path.join(__dirname, 'support/dummy-plugin')
        }
      }

      const router = {
        callback: args => {
          forwardedRouter = args[0]
        }
      }

      return plugins.load(list, router, {}).then(() => {
        assert.equal(forwardedRouter, router)
      })
    })

    it('should forward the params', () => {
      let forwardedParams

      const list = {
        dummy: {
          module: path.join(__dirname, 'support/dummy-plugin')
        }
      }

      const router = {
        callback: args => {
          forwardedParams = args[1]
        }
      }

      const config = {
        dummy: {}
      }

      return plugins.load(list, router, config).then(() => {
        assert.equal(forwardedParams, config.dummy)
      })
    })

    it('should forward the plugin config', () => {
      let forwardedPluginConfig

      const list = {
        dummy: {
          module: path.join(__dirname, 'support/dummy-plugin')
        }
      }

      const router = {
        callback: args => {
          forwardedPluginConfig = args[2]
        }
      }

      return plugins.load(list, router, {}).then(() => {
        assert.equal(forwardedPluginConfig, list.dummy)
      })
    })

    it('should forward the context', () => {
      let forwardedContext

      const list = {
        dummy: {
          module: path.join(__dirname, 'support/dummy-plugin')
        }
      }

      const router = {
        callback: (args, context) => {
          forwardedContext = context
        }
      }

      const context = {}

      return plugins.load(list, router, {}, context).then(() => {
        assert.equal(forwardedContext, context)
      })
    })

    it('should load plugins in serial sequence', () => {
      const sequence = []

      const list = {
        dummy0: {
          module: path.join(__dirname, 'support/dummy-plugin')
        },
        dummy1: {
          module: path.join(__dirname, 'support/dummy-plugin')
        },
        dummy2: {
          module: path.join(__dirname, 'support/dummy-plugin')
        }
      }

      const router = {
        callback: args => {
          sequence.push(args[2].name)
        }
      }

      return plugins.load(list, router, {}).then(() => {
        assert.deepEqual(sequence, ['dummy0', 'dummy1', 'dummy2'])
      })
    })
  })
})
