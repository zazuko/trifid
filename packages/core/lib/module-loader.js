import path from 'path'

function resolve (modulePath) {
  if (modulePath.slice(0, 1) === '.') {
    return path.resolve(modulePath)
  } else {
    return modulePath
  }
}

async function customImport (modulePath) {
  if (!modulePath.endsWith('.js')) {
    console.log(`Warning: declared ${modulePath} . Did you mean ${modulePath}.js ?`)
  }
  const { default: func } = await import(resolve(modulePath))
  return func
}

export default customImport
