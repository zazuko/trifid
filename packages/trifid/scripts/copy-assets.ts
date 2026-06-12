// Build helper: copy the example instances (config files, templates, static
// assets) into `dist/` so the default configuration path resolved from
// `import.meta.url` keeps working from the compiled `dist/` output.
import { cp } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(packageRoot, 'dist');

const assets = [
  'instances',
];

for (const asset of assets) {
  await cp(join(packageRoot, asset), join(distDir, asset), { recursive: true });
}

// eslint-disable-next-line no-console
console.log(`Copied runtime assets into ${distDir}`);
