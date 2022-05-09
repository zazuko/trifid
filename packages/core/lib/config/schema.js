/**
 * This is the JSON schema representation of the configuration file.
 */

const schema = {
  type: 'object',
  properties: {
    extends: {
      type: 'array',
      items: {
        type: 'string'
      }
    }
  },
  additionalProperties: false
}

export default schema
