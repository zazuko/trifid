import hijackResponse from 'hijackresponse'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import rdfFormats from '@rdfjs/formats-common'
import { createRenderer } from './renderer/clownface.js'
import rdf from 'rdf-ext'

const { parsers } = rdfFormats

const currentDir = dirname(fileURLToPath(import.meta.url))

const factory = async (trifid) => {
  const { render, logger, config } = trifid
  const renderer = createRenderer({ options: config })
  const { path } = config
  const entityTemplatePath = path || `${currentDir}/views/render.hbs`

  return async (req, res, next) => {
    // only take care of the rendering if HTML is requested
    const accepts = req.accepts(['text/plain', 'json', 'html'])
    if (accepts !== 'html') {
      return next()
    }

    hijackResponse(res, next).then(async ({ readable, writable }) => {
      const contentType = res.getHeader('Content-Type')
      if (!contentType) {
        return readable.pipe(writable)
      }

      const mimeType = contentType.toLowerCase().split(';')[0].trim()
      const hijackFormats = [
        'application/ld+json',
        'application/trig',
        'application/n-quads',
        'application/n-triples',
        'text/n3',
        'text/turtle',
        'application/rdf+xml']
      if (!hijackFormats.includes(mimeType)) {
        return readable.pipe(writable)
      }

      const quadStream = await parsers.import(mimeType, readable)
      const dataset = await rdf.dataset().import(quadStream)

      let contentToForward
      try {
        const data = await renderer(req, { dataset })
        const view = await render(entityTemplatePath, {
          dataset: data
        })
        contentToForward = view
        res.setHeader('Content-Type', 'text/html')
      } catch (e) {
        logger.error(e)
        return readable.pipe(writable)
      }

      writable.write(contentToForward)
      writable.end()
    })
  }
}

export default factory
