import i18n from 'i18n';

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { TrifidPlugin } from 'trifid-core';

const I18n = i18n.I18n;

const defaults: i18n.ConfigurationOptions = {
  queryParameter: 'lang',
  directory: 'locales',
  indent: '  ',
  extension: '.json',
  objectNotation: true,
  logDebugFn: (_msg) => { },
  logWarnFn: (_msg) => { },
  logErrorFn: (_msg) => { },
};

const factory: TrifidPlugin = async (trifid) => {
  const { config, registerTemplateHelper, server } = trifid;

  // Force user to define the `directory` parameter
  if (!config.directory || typeof config.directory !== 'string') {
    throw new Error(
      'The \'directory\' configuration field should be a non-empty string.',
    );
  }

  const i18nInstance = new I18n({
    ...defaults,
    ...config,
  } as i18n.ConfigurationOptions);

  /**
   * Hook to configure the language in the locals.
   *
   * @param request Request.
   * @param _reply Reply.
   * @param done Done function.
   */
  const onRequestHookHandler = (request: FastifyRequest, _reply: FastifyReply, done: (err?: Error) => void) => {
    const session = request.session;
    const currentLanguage = (session.get('currentLanguage') || session.get('defaultLanguage') || 'en') as string;
    i18nInstance.setLocale(currentLanguage);
    const t = (phrase: string) => i18nInstance.__({
      phrase,
      locale: currentLanguage,
    });
    session.set('t', t);

    registerTemplateHelper('i18n', (value: string) => {
      return t(value);
    });

    done();
  };
  server.addHook('onRequest', onRequestHookHandler);
};

export default factory;
