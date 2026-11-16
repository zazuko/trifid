import { cp } from 'node:fs/promises';
for (const asset of ['views', 'build']) {
  await cp(new URL('../' + asset, import.meta.url), new URL('../dist/' + asset, import.meta.url), {
    recursive: true,
  });
}
