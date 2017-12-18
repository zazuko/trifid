const difference = require('lodash/difference')
const hijackResponse = require('hijackresponse')
const streamBuffers = require('stream-buffers')

require('express-negotiate')

const requestHeaderWhitelist = [
  'host',
  'x-forwarded-host',
  'x-forwarded-proto'
]

const responseHeaderWhitelist = [
  'link',
  'set-cookie'
]

function middleware (options) {
  return (req, res, next) => {
    req.negotiate({
      html: () => {
        // remove all request header sent from the client which are not required
        difference(Object.keys(req.headers), requestHeaderWhitelist).forEach((name) => {
          delete req.headers[name]
        })

        // set html middleware request headers for the handler
        req.headers['accept'] = options.render.accept

        hijackResponse(res, (err, res) => {
          if (err) {
            res.unhijack()

            return next(err)
          }

          // add missing next in hijacked req
          req.next = (err) => {
            res.unhijack()

            next(err)
          }

          const graphBuffer = new streamBuffers.WritableStreamBuffer()

          graphBuffer.on('finish', () => {
            const graphString = graphBuffer.getContentsAsString('utf8')

            // don't process graph if it's bigger than graphSizeLimit
            if (options.graphSizeLimit && (graphString || '').length > options.graphSizeLimit) {
              res.status(413)
            } else {
              res.locals.graph = graphString
            }

            res.locals.graph = graphString

            // remove all response headers sent from handler
            if (res._headers) {
              difference(Object.keys(res._headers), responseHeaderWhitelist).forEach((name) => {
                res.removeHeader(name)
              })
            }

            // set new response headers
            res.setHeader('content-type', 'text/html')

            // use renderer to build body
            if (res.statusCode === 200) {
              options.render(req, res)
            } else {
              // use .error method if renderer has one
              if (options.render.error) {
                options.render.error(req, res)
              } else {
                options.render(req, res)
              }
            }
          })

          res.pipe(graphBuffer)
        })

        next()
      },

      default: () => {
        next()
      }
    })
  }
}

function renderer (router, options) {
  return this.middleware.mountAll(router, options, (options) => {
    // load render module and forward options to the factory
    options.render = require(options.module)(options)

    return middleware(options)
  })
}

module.exports = renderer
