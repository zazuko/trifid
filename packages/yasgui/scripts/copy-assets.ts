// Build helper: copy the non-TypeScript runtime assets into `dist/`, preserving
// their relative layout so the `import.meta.url`-relative paths used at runtime
// keep resolving from the compiled `dist/` output. `build/` holds the
// esbuild-bundled browser plugins and `public/` the browser-served assets.
import { cp } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(packageRoot, 'dist');

const assets = [
  'views',
  'public',
  'build',
];

for (const asset of assets) {
  await cp(join(packageRoot, asset), join(distDir, asset), { recursive: true });
}

// eslint-disable-next-line no-console
console.log(`Copied runtime assets into ${distDir}`);
