const path = require('path')

const resolve = (modulePath) => {
  if (modulePath.slice(0, 1) === '.') {
    return path.resolve(modulePath)
  } else {
    return modulePath
  }
}

const customRequire = (modulePath) => {
  return require(resolve(modulePath))
}

module.exports = {
  resolve,
  require: customRequire
}
