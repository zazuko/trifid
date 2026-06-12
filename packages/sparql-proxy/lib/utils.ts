/**
 * Generate the value for the Authorization header for basic authentication.
 *
 * @param user The username.
 * @param password The password of that user.
 * @returns The value of the Authorization header to use.
 */
export const authBasicHeader = (user: string, password: string): string => {
  const base64String = Buffer.from(`${user}:${password}`).toString('base64');
  return `Basic ${base64String}`;
};

/**
 * Assert that the value is an object.
 * Return the value if it is an object, otherwise return false.
 *
 * @param value The value to assert.
 * @returns The value, if it is an object, otherwise false.
 */
export const assertObject = (value: unknown): Record<string, unknown> | false => {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  return value as Record<string, unknown>;
};

/**
 * Return the length of an object.
 *
 * @param obj The object to get the length of.
 * @returns The length of the object.
 */
export const objectLength = (obj: unknown): number => {
  const asObject = assertObject(obj);
  if (!asObject) {
    return 0;
  }
  return Object.keys(asObject).length;
};

/**
 * Check if a string is a valid URL.
 *
 * @param url The URL to check.
 * @returns True if the URL is valid, false otherwise.
 */
export const isValidUrl = (url: unknown): boolean => {
  try {
    new URL(url as string);
    return true;
  } catch {
    return false;
  }
};
