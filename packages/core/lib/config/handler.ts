import fs from 'node:fs/promises';
import { dirname } from 'node:path';

import merge from 'lodash/merge.js';
import JSON5 from 'json5';
import { parse } from 'yaml';
import cloneDeep from 'lodash/cloneDeep.js';

import type { TrifidConfig, TrifidConfigWithExtends, TrifidPluginConfig } from '../../types/index.ts';
import { cwdCallback } from '../resolvers.ts';
import parser from './parser.ts';
import {
  extendsResolver,
  globalsResolver,
  pluginsResolver,
  serverResolver,
  templateResolver,
} from './resolvers.ts';
import { defaultPort, maxDepth } from './default.ts';

const resolveConfig = async (
  rawConfig: TrifidConfigWithExtends,
  fileFullPath: string | undefined = undefined,
  depth = 0,
): Promise<TrifidConfig> => {
  if (depth >= maxDepth) {
    throw new Error(
      'reached max configuration depth, maybe you went in an infinite loop. Please check the extends values from your configuration file recursively',
    );
  }

  const currentPath = fileFullPath ?? process.cwd();

  const config = parser(rawConfig);
  addDefaultFields(config);

  const context = dirname(currentPath);

  // fetch all configuration files from which this one is extending
  let configs: TrifidConfig[] = [];
  if (Array.isArray(config.extends) && config.extends.length > 0) {
    config.extends = extendsResolver(config.extends, context);
    configs = await Promise.all(
      config.extends.map((configPath) =>
        resolveConfigFile(configPath, depth + 1),
      ),
    );
  }

  // merge all fields
  const plugins: Record<string, TrifidPluginConfig> = {};
  configs.forEach((c) => {
    // merge template, globals and server parts
    config.globals = merge({}, c.globals ?? {}, config.globals ?? {});
    config.server = merge({}, c.server ?? {}, config.server ?? {});
    config.template = merge({}, c.template ?? {}, config.template ?? {});

    // merge plugins
    for (const [name, plugin] of Object.entries(c.plugins ?? {})) {
      plugins[name] = plugin;
    }
  });
  for (const [name, plugin] of Object.entries(config.plugins ?? {})) {
    plugins[name] = plugin;
  }

  // apply all resolvers
  config.plugins = pluginsResolver(plugins, context);
  config.globals = globalsResolver(config.globals, context);
  config.server = serverResolver(config.server, context);
  config.template = templateResolver(config.template, context);

  // we don't need the extends field anymore
  delete config.extends;

  return config;
};

const resolveConfigFile = async (filePath: string, depth = 0): Promise<TrifidConfig> => {
  // read config file
  const fileFullPath = cwdCallback(filePath);
  const fileContent = await fs.readFile(fileFullPath, 'utf-8');

  let parsed: TrifidConfigWithExtends;

  const fileExtension = `${fileFullPath.split('.').pop()}`.toLocaleLowerCase();
  if (['yaml', 'yml'].includes(fileExtension)) {
    parsed = parse(`${fileContent}`);
  } else {
    parsed = JSON5.parse(fileContent);
  }

  return await resolveConfig(parsed, fileFullPath, depth);
};

/**
 * Add default fields for a configuration.
 * Warning: this function mutates the config object.
 *
 * @param config Trifid configuration.
 */
const addDefaultFields = (config: TrifidConfig): void => {
  if (!config.server) {
    config.server = {
      listener: {},
    };
  }

  if (!config.globals) {
    config.globals = {};
  }

  if (!config.plugins) {
    config.plugins = {};
  }
};

/**
 * Add the default port for the server configuration.
 * Warning: this function mutates the config object.
 *
 * @param config Trifid configuration.
 */
const addDefaultPort = (config: TrifidConfig): void => {
  const server = config.server ?? (config.server = {});
  const listener = server.listener ?? (server.listener = {});
  if (listener.port === undefined) {
    listener.port = defaultPort;
  }
};

/**
 * Expand configuration and add default fields.
 *
 * @param configFile Configuration file path or configuration object.
 */
const handler = async (
  configFile: string | TrifidConfigWithExtends,
): Promise<TrifidConfig> => {
  let config: TrifidConfig;
  if (typeof configFile === 'string') {
    config = await resolveConfigFile(configFile);
  } else {
    config = await resolveConfig(cloneDeep(configFile));
  }
  addDefaultFields(config);
  addDefaultPort(config);

  return config;
};

export default handler;
