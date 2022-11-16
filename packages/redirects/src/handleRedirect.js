import { ns } from '../namespaces.js'
import rdf from 'rdf-ext'

function getResponseCode (responseCode) {
  if (ns.http[301].equals(responseCode)) {
    return 301
  }
  if (ns.http[302].equals(responseCode)) {
    return 302
  }
  if (ns.http[307].equals(responseCode)) {
    return 307
  }
  if (ns.http[308].equals(responseCode)) {
    return 308
  }
  return null
}

const handleRedirect = ({ term, dataset }) => {
  const pointer = rdf.clownface({ term, dataset })
  const responsePtr = pointer.in(ns.http.requestURI)
    .out(ns.http.response)
    .has(ns.rdf.type, ns.http.Response)
  const responseCode = responsePtr.out(ns.http.responseCode).term
  const location = responsePtr.out(ns.http.location).term
  const isMatch = responseCode && location

  if (isMatch) {
    return (req, res, next) => {
      const status = getResponseCode(responseCode) ?? 301
      res.status(status).redirect(location.value)
    }
  }
  return undefined
}

export default handleRedirect
