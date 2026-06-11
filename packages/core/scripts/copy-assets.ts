// Build helper: copy the non-TypeScript runtime assets into `dist/`, preserving
// their relative layout so that the path math based on `import.meta.url` (which
// resolves assets relative to the compiled modules) keeps working from `dist/`.
import { cp } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(packageRoot, 'dist')

// Each entry is a path relative to the package root that must be available at
// the same relative path inside `dist/` at runtime.
const assets = [
  'views',
  'static',
  join('lib', 'config', 'schema.json'),
]

for (const asset of assets) {
  await cp(join(packageRoot, asset), join(distDir, asset), { recursive: true })
}

// eslint-disable-next-line no-console
console.log(`Copied runtime assets into ${distDir}`)
