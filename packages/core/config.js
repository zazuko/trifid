import Ajv from 'ajv'

const ajv = new Ajv()

const schema = {
  type: 'object',
  additionalProperties: false
}

const data = {
  foo: 'bar'
}

const valid = ajv.validate(schema, data)
if (!valid) {
  throw new Error(ajv.errorsText())
}
