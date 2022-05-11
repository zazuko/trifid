import cloneDeep from 'lodash/cloneDeep.js'

const standardize = (middleware) => {
  const m = cloneDeep(middleware)

  // make sure order is defined
  if (m.order === undefined) {
    m.order = 0
  }

  // make sure paths is defined and is an array
  if (m.paths === undefined) {
    m.paths = []
  }
  if (typeof m.paths === 'string') {
    m.paths = [m.paths]
  }

  // make sure methods is defined and is an array
  if (m.methods === undefined) {
    m.methods = []
  }
  if (typeof m.methods === 'string') {
    m.methods = [m.methods]
  }

  // make sure hosts is defined and is an array
  if (m.hosts === undefined) {
    m.hosts = []
  }
  if (typeof m.hosts === 'string') {
    m.hosts = [m.hosts]
  }

  return m
}

export default standardize
