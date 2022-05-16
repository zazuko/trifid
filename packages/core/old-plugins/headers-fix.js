/**
 * workaround for missing headers after hijack
 * @param router
 */
function init (router) {
  router.use((err, req, res, next) => {
    res._headers = res._headers || {}

    next(err)
  })
}

export default init
