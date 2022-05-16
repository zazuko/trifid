/**
 * Adds routes for rendering static templates
 * @param router
 * @param options
 */
function staticViews (router, options) {
  if (!options) {
    return
  }

  Object.keys(options).filter(urlPath => options[urlPath]).forEach(urlPath => {
    const filePath = options[urlPath]

    router.get(urlPath, (req, res) => {
      res.render(filePath)
    })
  })
}

export default staticViews
