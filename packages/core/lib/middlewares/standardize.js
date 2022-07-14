import cloneDeep from 'lodash/cloneDeep.js'

// see: https://expressjs.com/fr/api.html#routing-methods (+all)
const supportedMethods = [
  'all',
  'checkout',
  'copy',
  'delete',
  'get',
  'head',
  'lock',
  'merge',
  'mkactivity',
  'mkcol',
  'move',
  'm-search',
  'notify',
  'options',
  'patch',
  'post',
  'purge',
  'put',
  'report',
  'search',
  'subscribe',
  'trace',
  'unlock',
  'unsubscribe'
]

const standardize = (middleware) => {
  const m = cloneDeep(middleware)

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
  m.methods = m.methods.map(method => {
    return method.toLocaleLowerCase()
  }).filter(method => {
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
