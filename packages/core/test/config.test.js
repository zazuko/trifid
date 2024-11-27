// @ts-check

import { describe, it } from 'node:test'
import { throws, doesNotThrow } from 'node:assert'

import parser from '../lib/config/parser.js'

describe('config', () => {
  it('should not throw if the configuration is empty', () => {
    doesNotThrow(() => parser())
    doesNotThrow(() => parser({}))
  })

  it('sould throw if we add some non-supported fields', () => {
    // @ts-expect-error
    throws(() => parser({ thisFieldIsNotSupported: true }))
  })

  it('should not throw if supported properties are empty', () => {
    doesNotThrow(() =>
      parser({
        extends: [],
        globals: {},
        server: {},
        plugins: {},
      }),
    )
  })

  it('should not throw on valid values for extends', () => {
    doesNotThrow(() =>
      parser({
        extends: [],
      }),
    )

    doesNotThrow(() =>
      parser({
        extends: ['path'],
      }),
    )

    doesNotThrow(() =>
      parser({
        extends: ['path1', 'path2', 'path3'],
      }),
    )
  })

  it('should throw on invalid values for extends', () => {
    // this is a string instead of an array of strings
    throws(() => {
      parser({
        // @ts-expect-error
        extends: 'this is a string instead of an array',
      })
    })

    // this is not an array of strings, but an array of integers
    throws(() => {
      parser({
        // @ts-expect-error
        extends: [1, 2, 3],
      })
    })
  })

  it('should not throw on valid values for server', () => {
    doesNotThrow(() => {
      parser({
        server: {},
      })
    })

    doesNotThrow(() => {
      parser({
        server: {
          listener: {},
          options: {},
        },
      })
    })

    doesNotThrow(() => {
      parser({
        server: {
          listener: {},
          options: {},
        },
      })
    })

    doesNotThrow(() => {
      parser({
        server: {
          listener: {
            port: 8080,
          },
          options: {},
        },
      })
    })

    doesNotThrow(() => {
      parser({
        server: {
          listener: {
            port: 8080,
          },
          options: {
            foo: 'bar',
          },
        },
      })
    })
  })

  it('should throw on invalid values for server', () => {
    // this is a string instead of an object
    throws(() => {
      parser({
        // @ts-expect-error
        server: 'this is a string instead of an object',
      })
    })

    // unsupported field
    throws(() => {
      parser({
        server: {
          listener: {},
          options: {},
          // @ts-expect-error
          unsupportedField: true,
        },
      })
    })

    // invalid port number
    throws(() => {
      parser({
        server: {
          listener: {
            port: 808080,
          },
          options: {},
        },
      })
    })

    // unsupported listener property
    throws(() => {
      parser({
        server: {
          listener: {
            port: 8080,
            // @ts-expect-error
            unsupportedField: true,
          },
          options: {},
        },
      })
    })
  })

  it('should not throw on valid values for globals', () => {
    doesNotThrow(() => {
      parser({
        globals: {},
      })
    })

    doesNotThrow(() => {
      parser({
        globals: {
          foo: 'bar',
        },
      })
    })

    doesNotThrow(() => {
      parser({
        globals: {
          foo: 'bar',
          jon: 'doe',
        },
      })
    })

    // multi-level globals
    doesNotThrow(() => {
      parser({
        globals: {
          foo: {
            bar: 'baz',
          },
        },
      })
    })
  })

  it('should throw on invalid values for globals', () => {
    // this is a string instead of an object
    throws(() => {
      parser({
        // @ts-expect-error
        globals: 'this is a string instead of an object',
      })
    })
  })

  it('should not throw on valid values for plugins', () => {
    doesNotThrow(() => {
      parser({
        plugins: {},
      })
    })

    doesNotThrow(() => {
      parser({
        plugins: {
          module: {
            order: 42,
            module: 'module',
          },
        },
      })
    })

    doesNotThrow(() => {
      parser({
        plugins: {
          module: {
            order: 42,
            module: 'module',
            config: {
              foo: 'bar',
            },
          },
        },
      })
    })

    doesNotThrow(() => {
      parser({
        plugins: {
          module: {
            order: 42,
            module: 'module',
            config: {
              foo: 'bar',
              baz: null,
            },
          },
        },
      })
    })

    // allow complex config object
    doesNotThrow(() => {
      parser({
        plugins: {
          module: {
            order: 42,
            module: 'module',
            config: {
              foo: {
                bar: 'baz',
              },
            },
          },
        },
      })
    })
  })

  describe('should throw on invalid values for plugins', () => {
    it('should throw if plugins is a string', () => {
      throws(() => {
        parser({
          // @ts-expect-error
          plugins: 'this is a string instead of an object',
        })
      })
    })

    it('should throw if plugins is not an object of plugins', () => {
      throws(() => {
        parser({
          plugins: {
            // @ts-expect-error
            order: 42,
            // @ts-expect-error
            name: 'module',
          },
        })
      })
    })

    it('should throw if the "module" property is missing', () => {
      throws(() => {
        parser({
          plugins: {
            module: {
              order: 42,
            },
          },
        })
      })
    })
  })
})
