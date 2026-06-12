import {
  cwdResolver,
  envResolver,
  fileCallback,
  fileResolver,
} from '../resolvers.ts';

/**
 *
 * @param value Array of paths.
 * @param context Configuration file full path.
 */
export const extendsResolver = (value: string[], context: string): string[] => {
  return value.map((path) => {
    return fileCallback(context)(fileResolver(cwdResolver(path), context));
  });
};

/**
 * Recursively expand resolver prefixes (`env:`, `cwd:`, `file:`) found in any
 * string contained in `value`. The shape of `value` is preserved.
 *
 * @param value Value to expand.
 * @param context Configuration file full path.
 */
export const applyResolvers = <T>(value: T, context: string): T => {
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const k of Object.keys(record)) {
      record[k] = applyResolvers(record[k], context);
    }
    return value;
  }

  if (typeof value === 'string') {
    return fileResolver(cwdResolver(envResolver(value)), context) as T;
  }

  return value;
};

export const templateResolver = <T>(value: T, context: string): T => {
  return applyResolvers(value, context);
};

export const serverResolver = <T>(value: T, context: string): T => {
  return applyResolvers(value, context);
};

export const globalsResolver = <T>(value: T, context: string): T => {
  return applyResolvers(value, context);
};

export const pluginsResolver = <T>(value: T, context: string): T => {
  return applyResolvers(value, context);
};
