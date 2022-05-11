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
          anyOf: [
            { type: 'number', minimum: 0, maximum: 65535 },
            { type: 'string', minLength: 1 }
          ]
        },
        host: { type: 'string', minLength: 1 }
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

const globals = {
  type: 'object',
  additionalProperties: true
}

const middleware = {
  type: 'object',
  properties: {
    order: { type: 'number', minimum: 0 },
    module: { type: 'string', minLength: 1 },
    paths: {
      anyOf: [
        { type: 'string', minLength: 1 },
        { type: 'array', items: { type: 'string' } }
      ]
    },
    methods: {
      anyOf: [
        { type: 'string', minLength: 1 },
        { type: 'array', items: { type: 'string' } }
      ]
    },
    hosts: {
      anyOf: [
        { type: 'string', minLength: 1 },
        { type: 'array', items: { type: 'string' } }
      ]
    },
    config: { type: 'object', additionalProperties: true }
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
    globals,
    middlewares
  },
  additionalProperties: false
}

export default schema
