import hijackResponse from 'hijackresponse'
import absoluteUrl from 'absolute-url'
import { Readable } from 'stream'

/**
 * Get a stream as a string.
 *
 * @param {ReadableStream} stream
 * @returns {Promise<string>}
 */
const getStreamAsString = async (stream) => {
  return new Promise(resolve => {
    const chunks = []

    stream.on('data', chunk => chunks.push(Buffer.from(chunk)))
    stream.on('end', () => resolve(Buffer.concat(chunks).toString()))
  })
}

/**
 * Parse any entry and return an expected boolean value.
 *
 * @param {any} value
 * @param {boolean} defaultValue
 * @returns
 */
const toBoolean = (value, defaultValue = false) => {
  if (value === undefined) {
    return defaultValue
  }

  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    const lowercaseValue = value.toLocaleLowerCase().trim()
    switch (lowercaseValue) {
      case 'true':
        return true
      case 'false':
        return false
    }
  }

  // we don't managed to parse it, so use the default value
  return defaultValue
}

/**
 * Rewrite the dataset base URL.
 *
 * Configuration fields:
 *  - datasetBaseUrl (string): the base URL to rewrite
 *  - rewriteContent (boolean): rewrite response content
 *  - rewriteIri (boolean): rewrite value of `req.iri`
 *
 * @param {*} trifid Trifid object containing the configuration, and other utility functions.
 * @returns Express middleware.
 */
export const factory = trifid => {
  const { config, logger } = trifid
  const { datasetBaseUrl, rewriteIri: optionIri, rewriteContent: optionContent } = config

  const rewriteIri = toBoolean(optionIri, true)
  const rewriteContent = toBoolean(optionContent, true)

  // do nothing if datasetBaseUrl is not defined or empty
  if (!datasetBaseUrl) {
    return (_req, _res, next) => {
      return next()
    }
  }

  // check if it is a valid URL
  try {
    new URL(datasetBaseUrl) // eslint-disable-line no-new
  } catch (_e) {
    throw new Error(`The current value you have for 'datasetBaseUrl' is '${datasetBaseUrl}', which is not a valid URL.`)
  }

  return async (req, res, next) => {
    // make sure that `absolute-url` middleware is used
    absoluteUrl.attach(req)

    const absoluteBaseUrl = new URL('/', req.absoluteUrl())
    const currentBaseUrl = absoluteBaseUrl.toString()

    // ignore the rewrite of IRI if requested or if `req.iri` is not defined
    if (rewriteIri && req.iri) {
      req.iri = req.iri.replaceAll(currentBaseUrl, datasetBaseUrl)
      logger.debug(`new IRI is ${req.iri}`)
    }

    if (!rewriteContent) {
      return next()
    }

    const { readable, writable } = await hijackResponse(res, next)
    if (!res.getHeaders) {
      return readable.pipe(writable)
    }

    const headers = res.getHeaders()
    if (!('content-type' in headers)) {
      return readable.pipe(writable)
    }

    if (headers['content-type'] !== 'application/sparql-results+json') {
      return readable.pipe(writable)
    }

    // reset content-length header
    res.removeHeader('content-length')

    const content = await getStreamAsString(readable)
    return Readable.from(content.replaceAll(datasetBaseUrl, currentBaseUrl)).pipe(writable)
  }
}

export default factory
