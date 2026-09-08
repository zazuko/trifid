import { describe, it, before, after } from 'node:test';
import { strictEqual, match, ok } from 'node:assert';
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import trifidCore, { assertRejection, getListenerURL } from '../../index.ts';

import viewPlugin from '../../plugins/view.ts';

import type { ConfigRecord } from '../../index.ts';

const currentDir = dirname(fileURLToPath(import.meta.url));

const createTrifidInstance = async (config: ConfigRecord) => {
  return await trifidCore(
    {
      server: {
        listener: {
          port: 0,
        },
        logLevel: 'warn',
      },
    },
    {
      view: {
        module: viewPlugin,
        paths: ['/view'],
        config,
      },
    },
  );
};

describe('view plugin', () => {
  it('should throw if the path parameter is not set', () => {
    // @ts-expect-error
    assertRejection(viewPlugin({}));
  });

  it('should throw if the path parameter is set to an empty string', () => {
    assertRejection(
      viewPlugin({
        // @ts-expect-error
        path: '',
      }),
    );
  });

  it('should throw if the file does not exist', async () => {
    const trifidInstance = await createTrifidInstance({
      path: 'non-existant-file',
    });
    const trifidListener = await trifidInstance.start();
    const pluginUrl = `${getListenerURL(trifidListener)}/view`;
    const response = await fetch(pluginUrl);
    await trifidListener.close();

    strictEqual(response.status, 500);
  });

  it('should work with a basic template', async () => {
    const trifidInstance = await createTrifidInstance({
      path: join(currentDir, '..', 'support', 'plugins', 'view', 'basic.hbs'),
    });
    const trifidListener = await trifidInstance.start();
    const pluginUrl = `${getListenerURL(trifidListener)}/view`;
    const response = await fetch(pluginUrl);
    await trifidListener.close();
    const text = await response.text();
    match(text, /Hello world!/);

    strictEqual(response.status, 200);
  });

  it('should forward the context', async () => {
    const trifidInstance = await createTrifidInstance({
      path: join(currentDir, '..', 'support', 'plugins', 'view', 'context.hbs'),
      context: {
        data: 'Hello world!',
      },
    });
    const trifidListener = await trifidInstance.start();
    const pluginUrl = `${getListenerURL(trifidListener)}/view`;
    const response = await fetch(pluginUrl);
    await trifidListener.close();
    const text = await response.text();
    match(text, /Template: Hello world!/);

    strictEqual(response.status, 200);
  });

  it('should be able to set a custom title', async () => {
    const trifidInstance = await createTrifidInstance({
      path: join(currentDir, '..', 'support', 'plugins', 'view', 'context.hbs'),
      options: {
        title: 'Hello world!',
      },
    });
    const trifidListener = await trifidInstance.start();
    const pluginUrl = `${getListenerURL(trifidListener)}/view`;
    const response = await fetch(pluginUrl);
    await trifidListener.close();
    const text = await response.text();
    match(text.toLowerCase(), /<title>hello world!<\/title>/);
    match(text, /Hello world!/);

    strictEqual(response.status, 200);
  });

  it('should be able to set a custom title and set context', async () => {
    const trifidInstance = await createTrifidInstance({
      path: join(currentDir, '..', 'support', 'plugins', 'view', 'context.hbs'),
      options: {
        title: 'Custom Title',
      },
      context: {
        data: 'Hello world!',
      },
    });
    const trifidListener = await trifidInstance.start();
    const pluginUrl = `${getListenerURL(trifidListener)}/view`;
    const response = await fetch(pluginUrl);
    await trifidListener.close();
    const text = await response.text();
    match(text.toLowerCase(), /<title>custom title<\/title>/);
    match(text, /Custom Title/);
    match(text, /Template: Hello world!/);

    strictEqual(response.status, 200);
  });

  describe('template file reporting', () => {
    let directory: string;

    before(async () => {
      directory = await mkdtemp(join(tmpdir(), 'trifid-view-'));
      await writeFile(join(directory, 'good.hbs'), '<p>ok</p>');
      await writeFile(join(directory, 'unreadable.hbs'), '<p>secret</p>');
      await chmod(join(directory, 'unreadable.hbs'), 0o000);
      await mkdir(join(directory, 'a-directory'));
    });

    after(async () => {
      // Restore the permissions so that the directory can be removed
      await chmod(join(directory, 'unreadable.hbs'), 0o644);
      await rm(directory, { recursive: true, force: true });
    });

    /**
     * Load the plugin and collect the errors it reports.
     *
     * @param config Plugin configuration.
     * @returns The reported errors.
     */
    const loadPlugin = async (config: ConfigRecord) => {
      const errors: string[] = [];
      const logger = {
        error: (message: unknown) => {
          errors.push(`${message}`);
        },
      };

      try {
        // @ts-expect-error only the fields used by the factory are provided
        await viewPlugin({ config, logger, render: async () => '' });
      } catch {
        // The missing `path` case rejects, which is asserted separately
      }

      return errors;
    };

    it('should report a missing path', async () => {
      const errors = await loadPlugin({});

      strictEqual(errors.length, 1);
      match(errors.join('\n'), /missing 'path' field/);
    });

    it('should report a path that does not exist', async () => {
      const errors = await loadPlugin({ path: join(directory, 'nope.hbs') });

      strictEqual(errors.length, 1);
      match(errors.join('\n'), /does not exist/);
    });

    it('should report a file that cannot be read', async (t) => {
      // `root` bypasses the permission bits, so the file would be readable
      if (process.getuid?.() === 0) {
        t.skip('running as root, file permissions are not enforced');
        return;
      }

      const errors = await loadPlugin({ path: join(directory, 'unreadable.hbs') });

      strictEqual(errors.length, 1);
      match(errors.join('\n'), /permission denied/);
    });

    it('should report a path that is not a file', async () => {
      const errors = await loadPlugin({ path: join(directory, 'a-directory') });

      strictEqual(errors.length, 1);
      match(errors.join('\n'), /is not a file/);
    });

    it('should report nothing for a readable template file', async () => {
      const errors = await loadPlugin({ path: join(directory, 'good.hbs') });

      strictEqual(errors.length, 0);
    });

    it('should include the configured path in the message', async () => {
      const path = join(directory, 'nope.hbs');
      const errors = await loadPlugin({ path });

      ok(errors.join('\n').includes(path));
    });
  });
});
