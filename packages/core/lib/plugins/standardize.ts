import cloneDeep from 'lodash/cloneDeep.js';

import type { ConfigRecord, TrifidPlugin } from '../../types/index.ts';

// see: https://fastify.dev/docs/latest/Reference/Routes/#routes-options
const supportedMethods = [
  'DELETE',
  'GET',
  'HEAD',
  'PATCH',
  'POST',
  'PUT',
  'OPTIONS',
  'SEARCH',
  'TRACE',
  'PROPFIND',
  'PROPPATCH',
  'MKCOL',
  'COPY',
  'MOVE',
  'LOCK',
  'UNLOCK',
];

/**
 * A plugin entry once its `module` has been resolved to a loaded plugin
 * function, but before its fields have been normalized.
 */
export interface LoadedPlugin {
  order?: number;
  module: TrifidPlugin;
  paths?: string | string[];
  methods?: string | string[];
  hosts?: string | string[];
  config?: ConfigRecord;
}

/**
 * A plugin entry with all of its fields normalized to a predictable shape.
 */
export interface StandardizedPlugin {
  order: number;
  module: TrifidPlugin;
  paths: string[];
  methods: string[];
  hosts: string[];
  config: ConfigRecord;
}

const toArray = (value: string | string[] | undefined): string[] => {
  if (typeof value === 'string') {
    return [value];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return [];
};

const standardize = (plugin: LoadedPlugin): StandardizedPlugin => {
  const m = cloneDeep(plugin);

  // make sure order is defined
  const order = m.order === undefined ? 100 : m.order;

  // make sure paths is defined and is an array
  const paths = toArray(m.paths);

  // make sure methods is defined and is an array of valid supported methods
  const methods = toArray(m.methods)
    .map((method) => method.toLocaleUpperCase())
    .filter((method) => supportedMethods.includes(method));

  // make sure hosts is defined and is an array
  const hosts = toArray(m.hosts);

  // make sure config is defined
  const config = m.config ?? {};

  return {
    ...m,
    order,
    paths,
    methods,
    hosts,
    config,
  };
};

export default standardize;
