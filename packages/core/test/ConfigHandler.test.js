/* global describe, it */

import assert from 'assert'
import path, { dirname } from 'path'
import ConfigHandler from '../lib/ConfigHandler.js'
import cloneDeep from 'lodash/cloneDeep.js'
import merge from 'lodash/merge.js'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('ConfigHandler', () => {
  it('should be a constructor', () => {
    assert.equal(typeof ConfigHandler, 'function')
  })

  describe('.resolve', () => {
    it('should be a method', () => {
      const c = new ConfigHandler()

      assert.equal(typeof c.resolve, 'function')
    })

    it('should use the resolver member object to resolve the prefixes', () => {
      const c = new ConfigHandler()

      c.resolver.use('trifid-core', ConfigHandler.pathResolver(__dirname))

      const config = {
        test: 'trifid-core:test'
      }

      return c.resolve(config).then(resolved => {
        assert.equal(resolved.test, path.join(__dirname, 'test'))
      })
    })
  })

  describe('.resolvePath', () => {
    it('should be a method', () => {
      const c = new ConfigHandler()

      assert.equal(typeof c.resolvePath, 'function')
    })

    it('should use the resolver member object to resolve the prefixe', () => {
      const c = new ConfigHandler()

      c.resolver.use('trifid-core', ConfigHandler.pathResolver(__dirname))

      return c.resolvePath('trifid-core:test').then(resolved => {
        assert.equal(resolved, path.join(__dirname, 'test'))
      })
    })
  })

  describe('.breakDownRule', () => {
    it('should be a method', () => {
      const c = new ConfigHandler()

      assert.equal(typeof c.breakDownRule, 'function')
    })

    it('should do nothing if the property is already set', () => {
      const c = new ConfigHandler()

      const config = {
        property: 0
      }

      const expected = cloneDeep(config)

      c.breakDownRule(config, 'property', {})

      assert.deepEqual(config, expected)
    })

    it('should assign the first found value if it\'s an array', () => {
      const c = new ConfigHandler()

      const config = {
        property: null,
        property1: 'test'
      }

      const expected = {
        property: config.property1,
        property1: config.property1
      }

      c.breakDownRule(config, 'property', ['property0', 'property1', 'property2'])

      assert.deepEqual(config, expected)
    })

    it('should assign the value if it\'s an object', () => {
      const c = new ConfigHandler()

      const config = {
        property: null
      }

      const expected = {
        property: {
          property0: 'test'
        }
      }

      c.breakDownRule(config, 'property', expected.property)

      assert.deepEqual(config, expected)
    })

    it('should assign the found value if it\'s a string', () => {
      const c = new ConfigHandler()

      const config = {
        property: null,
        property0: 'test'
      }

      const expected = {
        property: config.property0,
        property0: config.property0
      }

      c.breakDownRule(config, 'property', 'property0')

      assert.deepEqual(config, expected)
    })
  })

  describe('.breakDown', () => {
    it('should be a method', () => {
      const c = new ConfigHandler()

      assert.equal(typeof c.breakDown, 'function')
    })

    it(
      'should do nothing if the .breakDown property is not set in the config',
      () => {
        const c = new ConfigHandler()

        c.config = {
          property: 0
        }

        const expected = cloneDeep(c.config)

        return c.breakDown().then(() => {
          assert.deepEqual(c.config, expected)
        })
      }
    )

    it(
      'should process the rules given in the .breakDown property of the config',
      () => {
        const c = new ConfigHandler()

        c.config = {
          property: 0,
          property0: {},
          breakDown: {
            'property0.property00': 'property'
          }
        }

        const expected = cloneDeep(c.config)

        expected.property0.property00 = expected.property

        return c.breakDown().then(() => {
          assert.deepEqual(c.config, expected)
        })
      }
    )
  })

  describe('.configFromFile', () => {
    it('should be a method', () => {
      const c = new ConfigHandler()

      assert.equal(typeof c.configFromFile, 'function')
    })

    it('should read a config from a file', () => {
      const c = new ConfigHandler()

      return c.configFromFile(path.join(__dirname, 'support/base-config.json')).then(config => {
        assert(config.baseConfigProperty)
      })
    })

    it('should merge base config', () => {
      const c = new ConfigHandler()

      c.resolver.use('trifid-core', ConfigHandler.pathResolver(__dirname))

      return c.configFromFile(path.join(__dirname, 'support/config.json')).then(config => {
        assert(config.baseConfigProperty)
      })
    })
  })

  describe('.fromFile', () => {
    it('should be a method', () => {
      const c = new ConfigHandler()

      assert.equal(typeof c.fromFile, 'function')
    })

    it('should read a config from a file', () => {
      const c = new ConfigHandler()

      return c.fromFile(path.join(__dirname, 'support/base-config.json')).then(() => {
        assert(c.config.baseConfigProperty)
      })
    })

    it('should merge base config', () => {
      const c = new ConfigHandler()

      c.resolver.use('trifid-core', ConfigHandler.pathResolver(__dirname))

      return c.fromFile(path.join(__dirname, 'support/config.json')).then(() => {
        assert(c.config.baseConfigProperty)
      })
    })

    it('should merge deep base config', () => {
      const c = new ConfigHandler()

      c.resolver.use('trifid-core', ConfigHandler.pathResolver(__dirname))

      return c.fromFile(path.join(__dirname, 'support/merge-add-config.json')).then(() => {
        assert.equal(c.config.property0.property00.property00a, 'a')
        assert.equal(c.config.property0.property00.property00b, 'b')
      })
    })

    it('should merge deep base config including null values', () => {
      const c = new ConfigHandler()

      c.resolver.use('trifid-core', ConfigHandler.pathResolver(__dirname))

      return c.fromFile(path.join(__dirname, 'support/merge-remove-config.json')).then(() => {
        assert.equal(c.config.property0.property00, null)
      })
    })
  })

  describe('.fromJson', () => {
    it('should be a method', () => {
      const c = new ConfigHandler()

      assert.equal(typeof c.fromJson, 'function')
    })

    it('should assign a clone of the given config', () => {
      const c = new ConfigHandler()

      const config = {
        test: true
      }

      return c.fromJson(config).then(() => {
        assert.deepEqual(c.config, config)
        assert.notEqual(c.config, config)
      })
    })

    it('should merge base config', () => {
      const c = new ConfigHandler()

      const config = {
        baseConfig: path.join(__dirname, 'support/base-config.json'),
        test: true
      }

      const expected = merge({
        baseConfigProperty: true
      }, config)

      return c.fromJson(config).then(() => {
        assert.deepEqual(c.config, expected)
      })
    })

    it('should merge deep base config', () => {
      const c = new ConfigHandler()

      const config = {
        baseConfig: path.join(__dirname, 'support/merge-config.json'),
        property0: {
          property00: {
            property00b: 'b'
          }
        }
      }

      return c.fromJson(config).then(() => {
        assert.equal(c.config.property0.property00.property00a, 'a')
        assert.equal(c.config.property0.property00.property00b, 'b')
      })
    })

    it('should merge deep base config including null values', () => {
      const c = new ConfigHandler()

      const config = {
        baseConfig: path.join(__dirname, 'support/merge-config.json'),
        property0: {
          property00: null
        }
      }

      return c.fromJson(config).then(() => {
        assert.equal(c.config.property0.property00, null)
      })
    })
  })

  describe('.pathResolver', () => {
    it('should be a static method', () => {
      assert.equal(typeof ConfigHandler.pathResolver, 'function')
    })

    it('should return a function', () => {
      const resolver = ConfigHandler.pathResolver('')

      assert.equal(typeof resolver, 'function')
    })

    it('should do nothing if the path is already absolute', () => {
      const resolver = ConfigHandler.pathResolver('/var')

      const resolved = resolver('/home')

      assert.equal(resolved, '/home')
    })

    it('should add the base path to relative pathes', () => {
      const resolver = ConfigHandler.pathResolver('/var')

      const resolved = resolver('home')

      assert.equal(resolved, '/var/home')
    })
  })
})
