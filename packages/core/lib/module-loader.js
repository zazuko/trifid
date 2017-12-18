const path = require('path')

function resolve (modulePath) {
  if (modulePath.slice(0, 1) === '.') {
    return path.resolve(modulePath)
  } else {
    return modulePath
  }
}

function customRequire (modulePath) {
  return require(resolve(modulePath))
}

module.exports = {
  resolve: resolve,
  require: customRequire
}
