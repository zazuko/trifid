// @ts-check

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import Ajv from 'ajv'

const currentDir = dirname(fileURLToPath(import.meta.url))
const schemaPath = join(currentDir, 'schema.json')
const schemaContent = await readFile(schemaPath, 'utf8')
const schema = JSON.parse(schemaContent)

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
