import Ajv from 'ajv'
import schema from './schema.js'

const ajv = new Ajv()

/**
 * Return the configuration object if it is valid or throw an error in other cases.
 */
const parser = (data = {}) => {
  const valid = ajv.validate(schema, data)
  if (!valid) {
    throw new Error(ajv.errorsText())
  }
  return data
}

export default parser
