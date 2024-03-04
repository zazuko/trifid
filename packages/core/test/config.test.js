// @ts-check

import { describe, it } from 'mocha'
import { expect } from 'chai'

import parser from '../lib/config/parser.js'

describe('config', () => {
  it('should not throw if the configuration is empty', () => {
    expect(() => parser()).to.not.throw()
    expect(() => parser({})).to.not.throw()
  })

  it('sould throw if we add some non-supported fields', () => {
    expect(() => parser({ thisFieldIsNotSupported: true })).to.throw()
  })

  it('should not throw if supported properties are empty', () => {
    expect(() =>
      parser({
        extends: [],
        globals: {},
        server: {},
        plugins: {},
      }),
    ).to.not.throw()
  })

  it('should not throw on valid values for extends', () => {
    expect(() =>
      parser({
        extends: [],
      }),
    ).to.not.throw()

    expect(() =>
      parser({
        extends: ['path'],
      }),
    ).to.not.throw()

    expect(() =>
      parser({
        extends: ['path1', 'path2', 'path3'],
      }),
    ).to.not.throw()
  })

  it('should throw on invalid values for extends', () => {
    // this is a string instead of an array of strings
    expect(() => {
      parser({
        extends: 'this is a string instead of an array',
      })
    }).to.throw()

    // this is not an array of strings, but an array of integers
    expect(() => {
      parser({
        extends: [1, 2, 3],
      })
    }).to.throw()
  })

  it('should not throw on valid values for server', () => {
    expect(() => {
      parser({
        server: {},
      })
    }).to.not.throw()

    expect(() => {
      parser({
        server: {
          listener: {},
          express: {},
        },
      })
    }).to.not.throw()

    expect(() => {
      parser({
        server: {
          listener: {},
          express: {},
        },
      })
    }).to.not.throw()

    expect(() => {
      parser({
        server: {
          listener: {
            port: 8080,
          },
          express: {},
        },
      })
    }).to.not.throw()

    expect(() => {
      parser({
        server: {
          listener: {
            port: 8080,
          },
          express: {
            foo: 'bar',
          },
        },
      })
    }).to.not.throw()
  })

  it('should throw on invalid values for server', () => {
    // this is a string instead of an object
    expect(() => {
      parser({
        server: 'this is a string instead of an object',
      })
    }).to.throw()

    // unsupported field
    expect(() => {
      parser({
        server: {
          listener: {},
          express: {},
          unsupportedField: true,
        },
      })
    }).to.throw()

    // invalid port number
    expect(() => {
      parser({
        server: {
          listener: {
            port: 808080,
          },
          express: {},
        },
      })
    }).to.throw()

    // unsupported listener property
    expect(() => {
      parser({
        server: {
          listener: {
            port: 8080,
            unsupportedField: true,
          },
          express: {},
        },
      })
    }).to.throw()
  })

  it('should not throw on valid values for globals', () => {
    expect(() => {
      parser({
        globals: {},
      })
    }).to.not.throw()

    expect(() => {
      parser({
        globals: {
          foo: 'bar',
        },
      })
    }).to.not.throw()

    expect(() => {
      parser({
        globals: {
          foo: 'bar',
          jon: 'doe',
        },
      })
    }).to.not.throw()

    // multi-level globals
    expect(() => {
      parser({
        globals: {
          foo: {
            bar: 'baz',
          },
        },
      })
    }).to.not.throw()
  })

  it('should throw on invalid values for globals', () => {
    // this is a string instead of an object
    expect(() => {
      parser({
        globals: 'this is a string instead of an object',
      })
    }).to.throw()
  })

  it('should not throw on valid values for plugins', () => {
    expect(() => {
      parser({
        plugins: {},
      })
    }).to.not.throw()

    expect(() => {
      parser({
        plugins: {
          module: {
            order: 42,
            module: 'module',
          },
        },
      })
    }).to.not.throw()

    expect(() => {
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
    }).to.not.throw()

    expect(() => {
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
    }).to.not.throw()

    // allow complex config object
    expect(() => {
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
    }).to.not.throw()
  })

  describe('should throw on invalid values for plugins', () => {
    it('should throw if plugins is a string', () => {
      return expect(() => {
        parser({
          plugins: 'this is a string instead of an object',
        })
      }).to.throw()
    })

    it('should throw if plugins is not an object of plugins', () => {
      return expect(() => {
        parser({
          plugins: {
            order: 42,
            name: 'module',
          },
        })
      }).to.throw()
    })

    it('should throw if the "module" property is missing', () => {
      expect(() => {
        parser({
          plugins: {
            module: {
              order: 42,
            },
          },
        })
      }).to.throw()
    })
  })
})
