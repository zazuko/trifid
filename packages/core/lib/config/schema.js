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

const schema = {
  type: 'object',
  properties: {
    extends: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    server
  },
  additionalProperties: false
}

export default schema
