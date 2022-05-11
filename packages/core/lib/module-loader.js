import path from 'path'

const resolve = (modulePath) => {
  if (['.', '/'].includes(modulePath.slice(0, 1))) {
    return path.resolve(modulePath)
  } else {
    return modulePath
  }
}

const customImport = async (modulePath) => {
  const middleware = await import(resolve(modulePath))
  return middleware.default
}

export default customImport
