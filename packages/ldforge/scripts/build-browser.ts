import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

await build({
  absWorkingDir: fileURLToPath(new URL('..', import.meta.url)),
  entryPoints: ['browser/app.ts'],
  outdir: 'build',
  bundle: true,
  splitting: true,
  format: 'esm',
  minify: true,
  target: ['es2022'],
  loader: { '.woff': 'file', '.woff2': 'file' },
});
