/**
 * default error handler -> send no content
 * @param router
 */
function init (router) {
  router.use((err, req, res, next) => {
    console.error(err.stack || err.message)

    res.statusCode = err.statusCode || 500
    res.end()
  })
}

module.exports = init
