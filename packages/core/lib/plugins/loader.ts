import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import cloneDeep from 'lodash/cloneDeep.js';
import { moduleResolve } from 'import-meta-resolve';

import type { TrifidConfig, TrifidPlugin } from '../../types/index.ts';
import type { LoadedPlugin } from './standardize.ts';

/**
 * URL of the running application's entry point, used as the base to resolve
 * plugins that are dependencies of the application rather than of trifid-core.
 */
const applicationBase = new URL(pathToFileURL(process.argv[1] ?? `${process.cwd()}/`).href);

/**
 * Export conditions Node was started with, so that resolving plugins relative
 * to the application behaves like a regular import. The test suite relies on
 * this to load TypeScript sources via `--conditions=source` instead of the
 * built `dist/` output.
 */
const conditions = ((): Set<string> => {
  const result = new Set(['node', 'import']);
  const args = [
    ...process.execArgv,
    ...(process.env.NODE_OPTIONS ?? '').split(/\s+/).filter(Boolean),
  ];
  args.forEach((arg, index) => {
    const next = args[index + 1];
    if ((arg === '--conditions' || arg === '-C') && next) {
      result.add(next);
    } else if (arg.startsWith('--conditions=')) {
      result.add(arg.slice('--conditions='.length));
    } else if (arg.startsWith('-C') && arg.length > 2) {
      result.add(arg.slice(2));
    }
  });
  return result;
})();

const resolveModulePath = (modulePath: string): string => {
  // Local paths are resolved against the current working directory.
  if (['.', '/'].includes(modulePath.slice(0, 1))) {
    return pathToFileURL(resolve(modulePath)).href;
  }

  // Prefer Node's own resolution, relative to this module: it honours the
  // active export conditions and resolves trifid-core's own plugins as well as
  // any plugin hoisted above it (e.g. a flat npm layout).
  try {
    return import.meta.resolve(modulePath);
  } catch {
    // The plugin is a dependency of the application, not of trifid-core, and is
    // not reachable from here (e.g. pnpm's isolated node_modules). Resolve it
    // relative to the application instead.
    return moduleResolve(modulePath, applicationBase, conditions).href;
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
