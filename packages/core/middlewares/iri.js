import path from 'path'

const iri = (req, basePath) => {
  let host = req.get('host')
  let port = ''
  let protocol = req.protocol
  const originalUrl = new URL(`${protocol}://${host}${req.originalUrl}`)
  let { pathname } = originalUrl

  if (protocol === 'http' && req.socket.ssl) {
    protocol = 'https'
  }

  if (basePath) {
    pathname = path.join(basePath, pathname)
  }

  const headers = req.headers
  host = headers.host

  // use proxy header fields?
  if (req.app && req.app.get('trust proxy')) {
    if ('x-forwarded-proto' in headers) {
      protocol = headers['x-forwarded-proto']
    }

    if ('x-forwarded-host' in headers) {
      host = headers['x-forwarded-host']
    }
  }

  if (!host) {
    const address = req.socket.address()
    host = `${address.address}:${address.port}`
  }

  const hostSplit = host.split(':')
  if (hostSplit.length > 1) {
    host = hostSplit[0]
    port = parseInt(hostSplit[1])
  }

  // ignore port if default http(s) port
  if ([80, 443].includes(port)) {
    port = ''
  }

  // add ':' before port number
  if (port && port !== '') {
    port = `:${port}`
  }

  return `${protocol}://${host}${port}${pathname}`
}

const factory = (trifid) => {
  const { config } = trifid
  const { basePath } = config

  return (req, _res, next) => {
    req.iri = decodeURI(iri(req, basePath))
    next()
  }
}

export default factory
