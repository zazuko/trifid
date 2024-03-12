/**
 * Sort plugins
 * @param {*} plugins Object.entries from each plugins
 * @returns
 */
const sort = (plugins) =>
  plugins.sort((a, b) => {
    return a[1].order - b[1].order
  })

export default sort
