/**
 * Helpers to serve a Trifid instance under a subpath (e.g. `/SUBPATH`) instead
 * of at the root of a domain.
 */

/**
 * Normalize a configured subpath to its canonical form.
 *
 * The canonical form always starts and ends with a slash, so that templates can
 * build URLs by simple interpolation (`{{subpath}}static/core/style.css`) and
 * the default value is `/`, which keeps the historical behaviour.
 *
 * @param value The raw value coming from the configuration.
 * @returns The normalized subpath, `/` when nothing usable was configured.
 */
export const normalizeSubpath = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '/';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '/';
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  // Collapse duplicate slashes so that `//a//b` and `/a/b` behave the same
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, '/');

  return collapsed.endsWith('/') ? collapsed : `${collapsed}/`;
};

/**
 * Prefix a path with the configured subpath.
 *
 * Used for both route URLs and static file prefixes. With the default subpath
 * (`/`) the path is returned unchanged, so nothing moves for existing setups.
 *
 * @param subpath The normalized subpath.
 * @param path The path to prefix.
 * @returns The path, prefixed with the subpath.
 */
export const joinSubpath = (subpath: string, path: string): string => {
  if (subpath === '/') {
    return path;
  }

  // The subpath always ends with a slash, and the path always brings its own
  const base = subpath.slice(0, -1);
  if (path === '/') {
    return subpath;
  }

  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};
