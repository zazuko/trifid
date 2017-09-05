/* global describe, it */

const assert = require('assert')
const configTools = require('../lib/config')
const merge = require('lodash/merge')
const path = require('path')

describe('config', () => {
  it('should be an object', () => {
    assert.equal(typeof configTools, 'object')
  })

  describe('.breakDown', () => {
    it('should be a function', () => {
      assert.equal(typeof configTools.breakDown, 'function')
    })

    it('should ignore properties which are already set', () => {
      const handlerUrl = 'http://example.com/query'

      const config = {
        sparqlEndpointUrl: 'http://example.org/query',
        handler: {
          options: {
            endpointUrl: handlerUrl
          }
        }
      }

      return configTools.breakDown(config).then((breakDown) => {
        assert.equal(breakDown.handler.options.endpointUrl, handlerUrl)
      })
    })

    it('should use the first value if multiple rules are defined', () => {
      const sparqlProxyPath = '/query'

      const config = {
        sparqlEndpointUrl: 'http://example.org/query',
        sparqlProxy: {
          path: sparqlProxyPath
        }
      }

      return configTools.breakDown(config).then((breakDown) => {
        assert.equal(breakDown.yasgui.options.endpointUrl, sparqlProxyPath)
      })
    })

    it('should set object values', () => {
      const config = {}

      return configTools.breakDown(config).then((breakDown) => {
        assert.equal(typeof breakDown.handler.options, 'object')
      })
    })

    it('should set string values', () => {
      const sparqlEndpointUrl = 'http://example.org/query'

      const config = {
        sparqlEndpointUrl: sparqlEndpointUrl
      }

      return configTools.breakDown(config).then((breakDown) => {
        assert.equal(breakDown.handler.options.endpointUrl, sparqlEndpointUrl)
      })
    })
  })

  describe('.fromFile', () => {
    it('should be a function', () => {
      assert.equal(typeof configTools.fromFile, 'function')
    })

    it('should read a config from a file', () => {
      return configTools.fromFile(path.join(__dirname, 'support/base-config.json')).then((config) => {
        assert(config.baseConfigProperty)
      })
    })

    it('should merge base config', () => {
      return configTools.fromFile(path.join(__dirname, 'support/config.json')).then((config) => {
        assert(config.baseConfigProperty)
      })
    })
  })

  describe('.fromJson', () => {
    it('should be a function', () => {
      assert.equal(typeof configTools.fromJson, 'function')
    })

    it('should do nothing if there is no base config defined', () => {
      const config = {
        test: true
      }

      return configTools.fromJson(config).then((loaded) => {
        assert.equal(loaded, config)
      })
    })

    it('should merge base config', () => {
      const config = {
        baseConfig: 'trifid:test/support/base-config.json',
        test: true
      }

      const expected = merge({
        baseConfigProperty: true
      }, config)

      return configTools.fromJson(config).then((loaded) => {
        assert.deepEqual(loaded, expected)
      })
    })
  })

  describe('.resolve', () => {
    it('should be a function', () => {
      assert.equal(typeof configTools.resolve, 'function')
    })

    it('should expand the cwd prefix', () => {
      const config = {
        test: 'cwd:test'
      }

      return configTools.resolve(config).then((resolved) => {
        assert.equal(resolved.test, __dirname)
      })
    })

    it('should expand the trifid prefix', () => {
      const config = {
        test: 'trifid:test'
      }

      return configTools.resolve(config).then((resolved) => {
        assert.equal(resolved.test, __dirname)
      })
    })

    it('should expand the renderer prefix', () => {
      const config = {
        renderer: {
          module: 'lodash'
        },
        test: 'renderer:test'
      }

      return configTools.resolve(config).then((resolved) => {
        assert.equal(resolved.test, path.join(__dirname, '../node_modules/lodash/test'))
      })
    })
  })

  describe('.resolveFilePath', () => {
    it('should be a function', () => {
      assert.equal(typeof configTools.resolveFilePath, 'function')
    })

    it('should expand a prefixed path', () => {
      return configTools.resolveFilePath({}, 'trifid:test').then((resolved) => {
        assert.equal(resolved, __dirname)
      })
    })

    it('should not prepend absolute pathes', () => {
      return configTools.resolveFilePath({}, 'trifid:/test').then((resolved) => {
        assert.equal(resolved, '/test')
      })
    })
  })
})
