import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import cloneDeep from 'lodash/cloneDeep.js';
import { resolve as resolveModule } from 'import-meta-resolve';

import type { TrifidConfig, TrifidPlugin } from '../../types/index.ts';
import type { LoadedPlugin } from './standardize.ts';

/**
 * Base URL used to resolve bare plugin specifiers.
 *
 * Plugins are dependencies of the application that uses trifid-core, not of
 * trifid-core itself. Resolving them relative to this module would only work
 * when they happen to be hoisted above trifid-core (e.g. a flat npm layout),
 * which is not the case with pnpm's isolated node_modules. Resolving from the
 * application entry point (or, failing that, the current working directory)
 * makes plugin loading work regardless of the package manager layout.
 */
const applicationBase = pathToFileURL(process.argv[1] ?? `${process.cwd()}/`).href;

const resolveModulePath = (modulePath: string): string => {
  // Local paths are resolved against the current working directory.
  if (['.', '/'].includes(modulePath.slice(0, 1))) {
    return pathToFileURL(resolve(modulePath)).href;
  }

  // Bare specifiers are resolved relative to the application. Fall back to the
  // raw specifier (resolved relative to this module) if that fails, so the
  // original error is surfaced and flat layouts keep working.
  try {
    return resolveModule(modulePath, applicationBase);
  } catch {
    return modulePath;
  }
};

export const loader = async (modulePath: string): Promise<TrifidPlugin> => {
  const plugin = await import(resolveModulePath(modulePath));
  return plugin.default as TrifidPlugin;
};

const load = async (config: TrifidConfig): Promise<Record<string, LoadedPlugin>> => {
  const source = (config.plugins && typeof config.plugins === 'object')
    ? cloneDeep(config.plugins)
    : {};

  const plugins: Record<string, LoadedPlugin> = {};

  await Promise.all(
    Object.entries(source).map(async ([name, pluginConfig]) => {
      if (pluginConfig === null || pluginConfig === undefined) {
        return;
      }

      if (!pluginConfig.module) {
        throw new Error(`plugin '${name}' has no module configured`);
      }

      const { module, ...rest } = pluginConfig;
      plugins[name] = { ...rest, module: await loader(module) };
    }),
  );

  return plugins;
};

export default load;
