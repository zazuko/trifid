import type { FastifyReply, FastifyRequest } from 'fastify';

import type { TrifidPlugin } from '../types/index.ts';

const factory: TrifidPlugin = async (trifid) => {
  const { logger, server } = trifid;

  const defaultLanguage = 'en';
  const supportedLanguages = ['en', 'fr', 'de', 'it'];

  const oneMonthMilliseconds = 60 * 60 * 24 * 30 * 1000;

  /**
   * Hook to configure the language in the locals.
   *
   * @param request Request.
   * @param reply Reply.
   * @param done Done function.
   */
  const onRequestHookHandler = (
    request: FastifyRequest,
    reply: FastifyReply,
    done: (err?: Error) => void,
  ) => {
    const session = request.session;
    const currentLanguage = request.cookies.i18n || defaultLanguage;
    session.set('defaultLanguage', defaultLanguage);
    session.set('currentLanguage', currentLanguage);

    const langQuery = (request.query as { lang?: string }).lang || '';
    if (langQuery && supportedLanguages.includes(langQuery)) {
      logger.debug(`set default language to '${langQuery}'`);
      reply.setCookie('i18n', langQuery, { maxAge: oneMonthMilliseconds, path: '/' });
      session.set('currentLanguage', langQuery);
    }

    if (!session.has('t') || typeof session.get('t') !== 'function') {
      /**
       * Dummy translation function.
       *
       * @param x Translation key.
       * @returns Translation value.
       */
      const t = (x: string): string => {
        const translation = x.substring(x.indexOf(':') + 1);
        logger.debug(`translation value: ${translation}`);
        return translation;
      };
      session.set('t', t);
    }

    done();
  };
  server.addHook('onRequest', onRequestHookHandler);
};

export default factory;
