import type { StandardizedPlugin } from './standardize.ts';

/**
 * Sort plugins
 *
 * @param plugins Object.entries from each plugins
 */
const sort = (
  plugins: Array<[string, StandardizedPlugin]>,
): Array<[string, StandardizedPlugin]> =>
  plugins.sort((a, b) => {
    return a[1].order - b[1].order;
  });

export default sort;
