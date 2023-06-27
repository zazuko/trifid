/**
 * Sort middlewares
 * @param {*} middlewares Object.entries from each middlewares
 * @returns
 */
const sort = (middlewares) => middlewares.sort((a, b) => {
  return a[1].order - b[1].order
})

export default sort
