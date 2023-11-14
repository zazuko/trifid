// @ts-check

/**
 * Get the URL of a listener.
 *
 * @param {import('http').Server} listener HTTP listener
 * @returns {string}
 */
export const getListenerURL = (listener) => {
  const address = listener.address()
  if (!address) {
    throw new Error('The listener is not listening')
  }
  if (typeof address === 'string') {
    return address
  }

  const { address: hostname, port } = address
  return `http://${hostname}:${port}`
}
