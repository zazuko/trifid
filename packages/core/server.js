#!/usr/bin/env node
import('./dist/server.js').catch(() => {
  process.stderr.write('trifid-core is not built. Run `pnpm run build` in packages/core first.\n');
  process.exit(1);
});
