import hijackResponse from 'hijackresponse'
import { Readable } from 'stream'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import rdfFormats from '@rdfjs/formats-common'
import clownfaceRenderer from './renderer/clownface.js'

const { parsers, serializers } = rdfFormats

const currentDir = dirname(fileURLToPath(import.meta.url))

/**
 * Convert a Readable into a string.
 *
 * @param {Readable} readableStream The readable stream to convert.
 * @returns {Promise<string>} The result as a string.
 */
const readableToString = async (readableStream) => {
  const chunks = []
  for await (const chunk of readableStream) {
    chunks.push(chunk)
  }
  return chunks.join('')
}

/**
 * Convert a stream into a string.
 *
 * @param {*} readableStream The readable stream to convert.
 * @returns {Promise<string>} The result as a string.
 */
const streamToString = async (readableStream) => {
  const readable = Readable.from(readableStream, { encoding: 'utf8' })
  return readableToString(readable)
}

const factory = async (trifid) => {
  const { render, logger } = trifid

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
        'application/rdf+xml'
      ]
      if (!hijackFormats.includes(mimeType)) {
        return readable.pipe(writable)
      }

      // load render module
      const nquadsStream = serializers.import('application/ld+json', parsers.import(mimeType, readable))
      const streamData = await streamToString(nquadsStream)

      let contentToForward
      try {
        const graph = JSON.parse(streamData)
        const data = await clownfaceRenderer(req, graph)
        const view = await render(`${currentDir}/views/render.hbs`, {
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
