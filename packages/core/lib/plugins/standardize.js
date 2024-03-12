import cloneDeep from 'lodash/cloneDeep.js'

// see: https://fastify.dev/docs/latest/Reference/Routes/#routes-options
const supportedMethods = [
  'DELETE',
  'GET',
  'HEAD',
  'PATCH',
  'POST',
  'PUT',
  'OPTIONS',
  'SEARCH',
  'TRACE',
  'PROPFIND',
  'PROPPATCH',
  'MKCOL',
  'COPY',
  'MOVE',
  'LOCK',
  'UNLOCK',
]

const standardize = (plugin) => {
  const m = cloneDeep(plugin)

  // make sure order is defined
  if (m.order === undefined) {
    m.order = 100
  }

  // make sure paths is defined and is an array
  if (m.paths === undefined) {
    m.paths = []
  }
  if (typeof m.paths === 'string') {
    m.paths = [m.paths]
  }

  // make sure methods is defined and is an array of valid supported methods
  if (m.methods === undefined) {
    m.methods = []
  }
  if (typeof m.methods === 'string') {
    m.methods = [m.methods]
  }
  m.methods = m.methods
    .map((method) => {
      return method.toLocaleUpperCase()
    })
    .filter((method) => {
      return supportedMethods.includes(method)
    })

  // make sure hosts is defined and is an array
  if (m.hosts === undefined) {
    m.hosts = []
  }
  if (typeof m.hosts === 'string') {
    m.hosts = [m.hosts]
  }

  // make sure config is defined
  if (m.config === undefined) {
    m.config = {}
  }

  return m
}

export default standardize
