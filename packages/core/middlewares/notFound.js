import { dirname } from 'path'
import { fileURLToPath } from 'url'

const currentDir = dirname(fileURLToPath(import.meta.url))

const factory = (trifid) => {
  const { logger, render } = trifid

  return async (req, res, _next) => {
    logger.debug(`path '${req.url}' returned a 404 error (Not Found)`)

    res.status(404)

    const accepts = req.accepts(['text/plain', 'json', 'html'])
    switch (accepts) {
      case 'json':
        res.send({ success: false, message: 'Not found', status: 404 })
        break

      case 'html':
        res.send(await render(`${currentDir}/../views/404.hbs`, {
          url: req.url
        }, { title: 'Not Found' }))
        break

      default:
        res.send('Not Found\n')
        break
    }
  }
}

export default factory
