/* global describe, it */

import assert from 'assert'
import schema from '../lib/config/schema.js'
import parser from '../lib/config/parser.js'

describe('config', () => {
  it('should be an object', () => {
    assert.equal(typeof schema, 'object')
  })

  it('should not throw if the configuration is empty', () => {
    assert.doesNotThrow(() => {
      parser()
    })

    assert.doesNotThrow(() => {
      parser({})
    })
  })

  it('sould throw if we add some non-supported fields', () => {
    assert.throws(() => {
      parser({ thisFieldIsNotSupported: true })
    })
  })

  it('should not throw if supported properties are empty', () => {
    assert.doesNotThrow(() => {
      parser({
        extends: [],
        globals: {},
        server: {},
        middlewares: {}
      })
    })
  })

  it('should not throw on valid values for extends', () => {
    assert.doesNotThrow(() => {
      parser({
        extends: []
      })
    })

    assert.doesNotThrow(() => {
      parser({
        extends: [
          'path'
        ]
      })
    })

    assert.doesNotThrow(() => {
      parser({
        extends: [
          'path1',
          'path2',
          'path3'
        ]
      })
    })
  })

  it('should throw on invalid values for extends', () => {
    // this is a string instead of an array of strings
    assert.throws(() => {
      parser({
        extends: 'this is a string instead of an array'
      })
    })

    // this is not an array of strings, but an array of integers
    assert.throws(() => {
      parser({
        extends: [1, 2, 3]
      })
    })
  })

  it('should not throw on valid values for server', () => {
    assert.doesNotThrow(() => {
      parser({
        server: {}
      })
    })

    assert.doesNotThrow(() => {
      parser({
        server: {
          listener: {},
          express: {}
        }
      })
    })

    assert.doesNotThrow(() => {
      parser({
        server: {
          listener: {},
          express: {}
        }
      })
    })

    assert.doesNotThrow(() => {
      parser({
        server: {
          listener: {
            port: 8080
          },
          express: {}
        }
      })
    })

    assert.doesNotThrow(() => {
      parser({
        server: {
          listener: {
            port: 8080
          },
          express: {
            foo: 'bar'
          }
        }
      })
    })
  })

  it('should throw on invalid values for server', () => {
    // this is a string instead of an object
    assert.throws(() => {
      parser({
        server: 'this is a string instead of an object'
      })
    })

    // unsupported field
    assert.throws(() => {
      parser({
        server: {
          listener: {},
          express: {},
          unsupportedField: true
        }
      })
    })

    // invalid port number
    assert.throws(() => {
      parser({
        server: {
          listener: {
            port: 808080
          },
          express: {}
        }
      })
    })

    // unsupported listener property
    assert.throws(() => {
      parser({
        server: {
          listener: {
            port: 8080,
            unsupportedField: true
          },
          express: {}
        }
      })
    })
  })

  it('should not throw on valid values for globals', () => {
    assert.doesNotThrow(() => {
      parser({
        globals: {}
      })
    })

    assert.doesNotThrow(() => {
      parser({
        globals: {
          foo: 'bar'
        }
      })
    })

    assert.doesNotThrow(() => {
      parser({
        globals: {
          foo: 'bar',
          jon: 'doe'
        }
      })
    })
  })

  it('should throw on invalid values for globals', () => {
    // this is a string instead of an object
    assert.throws(() => {
      parser({
        globals: 'this is a string instead of an object'
      })
    })

    // complex object, keys and values should be strings
    assert.throws(() => {
      parser({
        globals: {
          foo: {
            bar: 'baz'
          }
        }
      })
    })
  })

  it('should not throw on valid values for middlewares', () => {
    assert.doesNotThrow(() => {
      parser({
        middlewares: {}
      })
    })

    assert.doesNotThrow(() => {
      parser({
        middlewares: {
          module: {
            order: 42,
            module: 'module'
          }
        }
      })
    })

    assert.doesNotThrow(() => {
      parser({
        middlewares: {
          module: {
            order: 42,
            module: 'module',
            config: {
              foo: 'bar'
            }
          }
        }
      })
    })

    assert.doesNotThrow(() => {
      parser({
        middlewares: {
          module: {
            order: 42,
            module: 'module',
            config: {
              foo: 'bar',
              baz: null
            }
          }
        }
      })
    })

    // allow complex config object
    assert.doesNotThrow(() => {
      parser({
        middlewares: {
          module: {
            order: 42,
            module: 'module',
            config: {
              foo: {
                bar: 'baz'
              }
            }
          }
        }
      })
    })
  })

  it('should throw on invalid values for middlewares', () => {
    // this is a string instead of an object
    assert.throws(() => {
      parser({
        middlewares: 'this is a string instead of an object'
      })
    })
  })

  // not scoped into an object per middleware
  assert.throws(() => {
    parser({
      middlewares: {
        order: 42,
        name: 'module'
      }
    })
  })

  // missing "module" property
  assert.throws(() => {
    parser({
      middlewares: {
        module: {
          order: 42
        }
      }
    })
  })
})
