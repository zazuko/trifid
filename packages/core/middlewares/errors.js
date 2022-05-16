const factory = (_trifid) => {
  return (err, _req, res, _next) => {
    console.error(err.stack || err.message)
    res.statusCode = err.statusCode || 500
    res.end()
  }
}

export default factory
