// @ts-check
import Ajv from 'ajv'
import schema from './schema.js'

// @ts-ignore
const ajv = new Ajv()

/**
 * Return the configuration object if it is valid or throw an error in other cases.
 *
 * @param {import('../../types/index.js').TrifidConfigWithExtends} [config] Configuration to validate.
 * @returns {import('../../types/index.js').TrifidConfigWithExtends} Valid configuration.
 */
const parser = (config) => {
  const data = !config ? {} : config
  const valid = ajv.validate(schema, data)
  if (!valid) {
    throw new Error(ajv.errorsText())
  }
  return data
}

export default parser
