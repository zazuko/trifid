import absoluteUrl from 'absolute-url'
import { URL } from 'url'

/**
 * Replacement for `url.format` which is deprecated.
 *
 * @param {*} urlObject The URL object.
 * @returns {string} URL as a string.
 */
const urlFrom = (urlObject) => String(Object.assign(new URL('http://example.com'), urlObject))

/**
 * Remove the searchParams part of a URL.
 *
 * @param {string} originalUrl Original URL.
 * @returns {string} The URL without the searchParams part.
 */
const removeSearchParams = (originalUrl) => {
  const url = new URL(originalUrl)
  url.search = ''
  url.searchParams.forEach((_value, key) => url.searchParams.delete(key))
  return urlFrom(url)
}

const factory = (trifid) => {
  const { logger } = trifid

  return (req, _res, next) => {
    absoluteUrl.attach(req)
    req.iri = decodeURI(removeSearchParams(req.absoluteUrl()))
    logger.debug(`value for req.iri: ${req.iri}`)
    next()
  }
}

export default factory
