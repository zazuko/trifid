const factory = (_trifid) => {
  return (_req, res, _next) => {
    res.set('Content-Type', 'text/plain')
    res.send('ok')
  }
}

export default factory
