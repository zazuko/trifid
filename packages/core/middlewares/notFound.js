const factory = (trifid) => {
  const { logger } = trifid

  return (req, res, _next) => {
    logger.debug(`path '${req.url}' returned a 404 error (Not Found)`)

    res.status(404)

    const accepts = req.accepts(['json', 'html'])
    switch (accepts) {
      case 'json':
        res.send({ error: 'Not found' })
        break
      case 'html':
        res.render('404', { url: req.url })
        break
      default:
        res.send('Not Found\n')
        break
    }
  }
}

export default factory
