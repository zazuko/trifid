import { strictEqual } from 'node:assert';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, afterEach } from 'node:test';

import trifidCore, { getListenerURL } from 'trifid-core';

import trifidPluginFactory from '../index.ts';

import type { FastifyInstance, FastifyReply } from 'fastify';

import type { ConfigRecord, RequestWithSession } from 'trifid-core';

const currentDir = dirname(fileURLToPath(import.meta.url));

const createTrifidInstance = (config: ConfigRecord) => {
  return trifidCore(
    {
      server: {
        listener: {
          port: 0,
        },
        logLevel: 'warn',
      },
    },
    {
      i18n: {
        module: trifidPluginFactory,
        config,
      },
      testPage: {
        module: async () => {
          return {
            defaultConfiguration: async () => {
              return {
                methods: ['GET'],
                paths: ['/'],
              };
            },
            routeHandler: async () => {
              /**
               * Route handler.
               * @param request Request.
               * @param reply Reply.
               */
              const handler = async (request: RequestWithSession, reply: FastifyReply) => {
                // The i18n plugin stores the translation function in the session
                const t = request.session.get('t') as (key: string) => string;
                reply.send(t('test'));
              };
              return handler;
            },
          };
        },
      },
    },
  );
};

describe('trifid-plugin-i18n', () => {
  let trifidListener: FastifyInstance | undefined;

  afterEach(async () => {
    if (!trifidListener) {
      return;
    }
    await trifidListener.close();
    trifidListener = undefined;
  });

  it('should throw if no directory is defined', async () => {
    try {
      await createTrifidInstance({});
    } catch (error) {
      strictEqual(
        (error as Error).message,
        "The 'directory' configuration field should be a non-empty string.",
      );
    }
  });

  it('should work with EN as default locale', async () => {
    const trifidInstance = await createTrifidInstance({
      locales: ['en', 'fr', 'de'],
      defaultLocale: 'en',
      directory: resolve(currentDir, 'support/locales'),
    });
    trifidListener = await trifidInstance.start();
    const res = await fetch(`${getListenerURL(trifidListener)}/`);
    const body = await res.text();
    strictEqual(res.status, 200);
    strictEqual(body, 'test-en');
  });

  it('should work with DE as default locale (should return EN)', async () => {
    const trifidInstance = await createTrifidInstance({
      locales: ['en', 'fr', 'de'],
      defaultLocale: 'de',
      directory: resolve(currentDir, 'support/locales'),
    });
    trifidListener = await trifidInstance.start();
    const res = await fetch(`${getListenerURL(trifidListener)}/`);
    const body = await res.text();
    strictEqual(res.status, 200);
    strictEqual(body, 'test-en');
  });

  it('should set a cookie in case the language changed', async () => {
    const trifidInstance = await createTrifidInstance({
      locales: ['en', 'fr', 'de'],
      defaultLocale: 'en',
      directory: resolve(currentDir, 'support/locales'),
    });
    trifidListener = await trifidInstance.start();
    const res = await fetch(`${getListenerURL(trifidListener)}/?lang=fr`);
    const cookies = res.headers.get('set-cookie') || '';
    strictEqual(cookies.startsWith('i18n=fr'), true);
    const body = await res.text(); // Just make sure that the stream is consumed
    strictEqual(res.status, 200);
    strictEqual(body, 'test-fr');
  });

  it('should use the language from the cookie', async () => {
    const trifidInstance = await createTrifidInstance({
      locales: ['en', 'fr', 'de'],
      defaultLocale: 'en',
      directory: resolve(currentDir, 'support/locales'),
    });
    trifidListener = await trifidInstance.start();
    const res = await fetch(`${getListenerURL(trifidListener)}/`, {
      headers: {
        cookie: 'i18n=fr',
      },
    });
    const body = await res.text();
    strictEqual(res.status, 200);
    strictEqual(body, 'test-fr');
  });

  it('should override cookie value if language is specified in query parameter', async () => {
    const trifidInstance = await createTrifidInstance({
      locales: ['en', 'fr', 'de'],
      defaultLocale: 'en',
      directory: resolve(currentDir, 'support/locales'),
    });
    trifidListener = await trifidInstance.start();
    const res = await fetch(`${getListenerURL(trifidListener)}/?lang=fr`, {
      headers: {
        cookie: 'i18n=de',
      },
    });
    const cookies = res.headers.get('set-cookie') || '';
    strictEqual(cookies.startsWith('i18n=fr'), true);
    const body = await res.text();
    strictEqual(res.status, 200);
    strictEqual(body, 'test-fr');
  });
});
