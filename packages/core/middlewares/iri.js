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
 * Remove the part of a URL.
 *
 * @param {string} originalUrl Original URL.
 * @param {*} part The part to remove.
 * @returns {string} The URL without the specified part.
 */
const removeUrlPart = (originalUrl, part) => {
  const parts = new URL(originalUrl)
  if (parts[part]) {
    delete parts[part]
  }
  return urlFrom(parts)
}

const factory = (trifid) => {
  const { logger } = trifid

  return (req, _res, next) => {
    absoluteUrl.attach(req)
    req.iri = decodeURI(removeUrlPart(req.absoluteUrl(), 'search'))
    logger.debug(`value for req.iri: ${req.iri}`)
    next()
  }
}

export default factory
