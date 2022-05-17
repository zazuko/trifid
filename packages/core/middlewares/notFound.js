const factory = (trifid) => {
  const { logger, render } = trifid

  return async (req, res, _next) => {
    logger.debug(`path '${req.url}' returned a 404 error (Not Found)`)

    res.status(404)

    const accepts = req.accepts(['json', 'html'])
    switch (accepts) {
      case 'json':
        res.send({ error: 'Not found' })
        break

      case 'html':
        res.send(render('<h1>Not Found</h1><p>The requested path <strong>{{ url }}</strong> was not found.</p>', {
          url: req.url
        }, {
          title: 'Not Found'
        }))
        break

      default:
        res.send('Not Found\n')
        break
    }
  }
}

export default factory
