/**
 * This is the JSON schema representation of the configuration file.
 */

const server = {
  type: 'object',
  properties: {
    listener: {
      type: 'object',
      properties: {
        port: {
          type: 'number',
          minimum: 0,
          maximum: 65535
        }
      },
      additionalProperties: false
    },
    express: {
      type: 'object',
      additionalProperties: true
    }
  },
  additionalProperties: false
}

const configurationKeys = {
  type: 'object',
  patternProperties: {
    '.*': {
      type: [
        'string',
        'null'
      ]
    }
  }
}

const middleware = {
  type: 'object',
  properties: {
    order: { type: 'number', minimum: 0 },
    module: { type: 'string', minLength: 1 },
    config: configurationKeys
  },
  required: ['module'],
  additionalProperties: false
}

const middlewares = {
  type: 'object',
  patternProperties: {
    '.*': middleware
  }
}

const schema = {
  type: 'object',
  properties: {
    extends: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    server,
    globals: configurationKeys,
    middlewares
  },
  additionalProperties: false
}

export default schema
