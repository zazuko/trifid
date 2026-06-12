/**
 * Return the value for the specific key.
 * If the value is not present, return the default value.
 *
 * @param key Key to search for
 * @param values Values to search in
 * @param defaultValue Default value to return
 * @returns Value for the specific key or the default value
 */
export const defaultValue = <T>(
  key: string,
  values: Record<string, unknown>,
  defaultValue: T,
): T => {
  const value = values[key];
  if (value === undefined) {
    return defaultValue;
  }
  return value as T;
};
