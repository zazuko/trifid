import { describe, expect, test } from '@jest/globals'

import schema from '../lib/config/schema.js'
import parser from '../lib/config/parser.js'

describe('config', () => {
  test('should be an object', () => {
    expect(typeof schema).toEqual('object')
  })

  test('should not throw if the configuration is empty', () => {
    expect(() => parser()).not.toThrow()
    expect(() => parser({})).not.toThrow()
  })

  test('sould throw if we add some non-supported fields', () => {
    expect(() => parser({ thisFieldIsNotSupported: true })).toThrow()
  })

  test('should not throw if supported properties are empty', () => {
    expect(() => parser({
      extends: [],
      globals: {},
      server: {},
      middlewares: {}
    })).not.toThrow()
  })

  test('should not throw on valid values for extends', () => {
    expect(() => parser({
      extends: []
    })).not.toThrow()

    expect(() => parser({
      extends: [
        'path'
      ]
    })).not.toThrow()

    expect(() => parser({
      extends: [
        'path1',
        'path2',
        'path3'
      ]
    })).not.toThrow()
  })

  test('should throw on invalid values for extends', () => {
    // this is a string instead of an array of strings
    expect(() => {
      parser({
        extends: 'this is a string instead of an array'
      })
    }).toThrow()

    // this is not an array of strings, but an array of integers
    expect(() => {
      parser({
        extends: [1, 2, 3]
      })
    }).toThrow()
  })

  test('should not throw on valid values for server', () => {
    expect(() => {
      parser({
        server: {}
      })
    }).not.toThrow()

    expect(() => {
      parser({
        server: {
          listener: {},
          express: {}
        }
      })
    }).not.toThrow()

    expect(() => {
      parser({
        server: {
          listener: {},
          express: {}
        }
      })
    }).not.toThrow()

    expect(() => {
      parser({
        server: {
          listener: {
            port: 8080
          },
          express: {}
        }
      })
    }).not.toThrow()

    expect(() => {
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
    }).not.toThrow()
  })

  test('should throw on invalid values for server', () => {
    // this is a string instead of an object
    expect(() => {
      parser({
        server: 'this is a string instead of an object'
      })
    }).toThrow()

    // unsupported field
    expect(() => {
      parser({
        server: {
          listener: {},
          express: {},
          unsupportedField: true
        }
      })
    }).toThrow()

    // invalid port number
    expect(() => {
      parser({
        server: {
          listener: {
            port: 808080
          },
          express: {}
        }
      })
    }).toThrow()

    // unsupported listener property
    expect(() => {
      parser({
        server: {
          listener: {
            port: 8080,
            unsupportedField: true
          },
          express: {}
        }
      })
    }).toThrow()
  })

  test('should not throw on valid values for globals', () => {
    expect(() => {
      parser({
        globals: {}
      })
    }).not.toThrow()

    expect(() => {
      parser({
        globals: {
          foo: 'bar'
        }
      })
    }).not.toThrow()

    expect(() => {
      parser({
        globals: {
          foo: 'bar',
          jon: 'doe'
        }
      })
    }).not.toThrow()
  })

  test('should throw on invalid values for globals', () => {
    // this is a string instead of an object
    expect(() => {
      parser({
        globals: 'this is a string instead of an object'
      })
    }).toThrow()

    // complex object, keys and values should be strings
    expect(() => {
      parser({
        globals: {
          foo: {
            bar: 'baz'
          }
        }
      })
    }).toThrow()
  })

  test('should not throw on valid values for middlewares', () => {
    expect(() => {
      parser({
        middlewares: {}
      })
    }).not.toThrow()

    expect(() => {
      parser({
        middlewares: {
          module: {
            order: 42,
            module: 'module'
          }
        }
      })
    }).not.toThrow()

    expect(() => {
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
    }).not.toThrow()

    expect(() => {
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
    }).not.toThrow()

    // allow complex config object
    expect(() => {
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
    }).not.toThrow()
  })

  test('should throw on invalid values for middlewares', () => {
    // this is a string instead of an object
    expect(() => {
      parser({
        middlewares: 'this is a string instead of an object'
      })
    }).toThrow()

    // not scoped into an object per middleware
    expect(() => {
      parser({
        middlewares: {
          order: 42,
          name: 'module'
        }
      })
    }).toThrow()

    // missing "module" property
    expect(() => {
      parser({
        middlewares: {
          module: {
            order: 42
          }
        }
      })
    }).toThrow()
  })
})
