import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import Ajv from 'ajv';

import type { TrifidConfigWithExtends } from '../../types/index.ts';

const currentDir = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(currentDir, 'schema.json');
const schemaContent = await readFile(schemaPath, 'utf8');
const schema = JSON.parse(schemaContent);

// @ts-ignore -- Ajv's CommonJS default export is not seen as constructable under NodeNext
const ajv = new Ajv();

/**
 * Return the configuration object if it is valid or throw an error in other cases.
 *
 * @param config Configuration to validate.
 * @returns Valid configuration.
 */
const parser = (config?: TrifidConfigWithExtends): TrifidConfigWithExtends => {
  const data = !config ? {} : config;
  const valid = ajv.validate(schema, data);
  if (!valid) {
    throw new Error(ajv.errorsText());
  }
  return data;
};

export default parser;
